import { getListeningRepositoryByUrl } from "@/lib/repository/listeningRepository/listeningRepositoryRepository";
import { ListeningRepository } from "@/lib/repository/listeningRepository/listeningRepositorySchema";
import { createScanJob } from "@/lib/repository/scanJob/scanJobRepository";
import { getUserSettingsById } from "@/lib/repository/user/userRepository";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

type Payload = {
  ref: string;
  repository: {
    html_url: string;
    default_branch: string;
  };
};

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const payload: Payload = z
      .object({
        ref: z.string(),
        repository: z.object({
          html_url: z.string(),
          default_branch: z.string(),
        }),
      })
      .parse(json);
    const listeningRepository = await getListeningRepositoryByUrl(
      payload.repository.html_url,
    );
    if (!listeningRepository) {
      return NextResponse.json("No listening repo set up for that repository", {
        status: 404,
      });
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

function shouldRunScan(
  payload: Payload,
  listening_repo: ListeningRepository,
): boolean {
  if (!payload.ref.startsWith("refs/heads/")) {
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
    return branch in listening_repo.branches;
  }

  return false;
}

function branchNameFromRef(ref: string): string {
  if (!ref.startsWith("refs/heads/")) {
    throw new Error("ref does not correspond to a branch");
  }
  return ref.slice(11); // everything after 'refs/heads/'
}
