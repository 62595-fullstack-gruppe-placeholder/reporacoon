import { decrypt } from "@/lib/auth/encryption";
import { getListeningRepositoryByUrl } from "@/lib/repository/listeningRepository/listeningRepositoryRepository";
import { ListeningRepository } from "@/lib/repository/listeningRepository/listeningRepositorySchema";
import { createScanJob } from "@/lib/repository/scanJob/scanJobRepository";
import { getUserSettingsById } from "@/lib/repository/user/userRepository";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { createHmac, timingSafeEqual } from "crypto";
import { log, LogLevel } from "@/lib/log";

const payloadSchema = z.object({
  ref: z.string(),
  repository: z.object({
    html_url: z.string(),
    default_branch: z.string(),
  }),
});

type Payload = z.infer<typeof payloadSchema>;

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const json = JSON.parse(rawBody);
    const payload = payloadSchema.parse(json);
    const listeningRepository = await getListeningRepositoryByUrl(
      payload.repository.html_url,
    );

    if (!listeningRepository) {
      return NextResponse.json("No listening repo set up for that repository", {
        status: 404,
      });
    }

    if (listeningRepository.encrypted_secret) {
      const authenticated = await authenticateRequest(
        rawBody,
        listeningRepository,
      );
      if (!authenticated) {
        return NextResponse.json("Unauthorized", { status: 401 });
      }
    }

    if (!shouldRunScan(payload, listeningRepository)) {
      return NextResponse.json("OK - no scan run", { status: 200 });
    }

    await createScanJob({
      owner_id: listeningRepository.owner_id,
      priority: 3,
      repo_url: listeningRepository.repo_url,
      listening_repository_id: listeningRepository.id,
    });

    const userSettings = await getUserSettingsById(
      listeningRepository.owner_id,
    );

    fetch("http://scraper:5001/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isDeepScan: false,
        extensions: userSettings ? userSettings.extensions : [],
      }),
    });
    return NextResponse.json("OK", { status: 200 });
  } catch (error: unknown) {
    console.log(error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}

async function authenticateRequest(
  rawBody: string,
  listeningRepository: ListeningRepository,
): Promise<boolean> {
  const hmacHeader = (await headers()).get("X-Hub-Signature-256");
  if (!hmacHeader) {
    log(
      "Failed to authenticate webhook request, no authentication header",
      LogLevel.error,
    );
    return false;
  }
  const secret = listeningRepository
    ? decrypt(listeningRepository.encrypted_secret!)
    : null;
  if (!secret) {
    log(
      "Failed to authenticate webhook request, couldn't decrypt secret",
      LogLevel.error,
    );
    return false;
  }

  const expected = `sha256=${createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex")}`;

  // Use timingSafeEqual to prevent timing attacks.
  // Both buffers must be the same length — if they differ, the signature is
  // structurally invalid anyway, so we can return false immediately.
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(hmacHeader, "utf8");

  if (a.length !== b.length) {
    log(
      "Failed to authenticate webhook request, hmac lengths differed",
      LogLevel.error,
    );
  }

  return timingSafeEqual(a, b);
}

function shouldRunScan(
  payload: Payload,
  listening_repo: ListeningRepository,
): boolean {
  if (!payload.ref.startsWith("refs/heads/")) {
    log("Skipping scan, ref was not a branch", LogLevel.debug);
    return false;
  }

  if (listening_repo.branch_config === "ALL") {
    return true;
  }

  const branch = branchNameFromRef(payload.ref);

  if (listening_repo.branch_config === "DEFAULT") {
    return branch === payload.repository.default_branch;
  }

  if (listening_repo.branch_config === "CUSTOM") {
    const skip = !listening_repo.branches.includes(branch);
    if (skip) {
      log(
        `Skipping scan, branch ${branch} not in ${listening_repo.branches}`,
        LogLevel.debug,
      );
      return false;
    }
    return true;
  }

  return false;
}

function branchNameFromRef(ref: string): string {
  if (!ref.startsWith("refs/heads/")) {
    throw new Error("ref does not correspond to a branch");
  }
  return ref.slice(11); // everything after 'refs/heads/'
}
