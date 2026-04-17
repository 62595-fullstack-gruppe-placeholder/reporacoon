"use server";

import { getUser } from "@/lib/auth/userFromToken";
import { encryptToken } from "@/lib/crypto";
import { getFindingsByJobId } from "@/lib/repository/scanFinding/scanFindingRepository";
import { ScanFinding } from "@/lib/repository/scanFinding/scanFindingSchema";
import { clearScanJobToken, createScanJob, getScanJobById } from "@/lib/repository/scanJob/scanJobRepository";
import { CreateScanJobDTO, createScanJobDTOSchema, ScanJob } from "@/lib/repository/scanJob/scanJobSchemas";

export async function createScanJobServerAction(input: CreateScanJobDTO) {
  return await createScanJob(createScanJobDTOSchema.parse(input));
}

export async function getFindingsByJobIdServerAction(jobId: string): Promise<ScanFinding[]> {
  return await getFindingsByJobId(jobId);
}

export async function getScanJobByIdServerAction(id: string): Promise<ScanJob> {
  return await getScanJobById(id);
}

export type ScanResult = {
  success: true;
  findings: ScanFinding[];
  jobs: ScanJob[];
} | {
  success: false;
  error: string;
};

export async function scan(input: CreateScanJobDTO & { url: string; repoKey: string | null; isDeepScan: boolean; extensions: Set<string> }): Promise<ScanResult> {
  try {
    const user = await getUser();
    
    // 1. Validate URL with Python service
    const validateResponse = await fetch("http://scraper:5001/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        url: input.url,
        repoKey: input.repoKey,
      }),
    });

    const validateData = await validateResponse.json();
    if (!validateResponse.ok || !validateData.valid) {
      return { success: false, error: validateData.message ?? "Invalid GitHub URL." };
    }

    // 2. Encrypt Token & Create Job in DB (Next.js is the Boss)
    const repokeyEncrypted = input.repoKey != null ? encryptToken(input.repoKey) : null;
    
    const job = await createScanJobServerAction({
      repo_url: input.url,
      owner_id: user?.id ?? null,
      repoKey: repokeyEncrypted,
      priority: 1,
    });

    // 3. Command the Scraper to start, giving it the exact ID and raw data
    const scanResponse = await fetch("http://scraper:5001/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        id: job.id, // TELL python the ID
        url: input.url, // TELL python the URL
        repoKey: input.repoKey, // Unencrypted key
        isDeepScan: input.isDeepScan, 
        extensions: Array.from(input.extensions),
        userId: user?.id ?? null
      }),
    });

    if (!scanResponse.ok) {
      return { success: false, error: "Failed to queue scan in the worker." };
    }

    // 4. Poll using the ID Next.js generated
    const POLL_INTERVAL_MS = 2000;
    const TIMEOUT_MS = 5 * 60 * 1000;
    const deadline = Date.now() + TIMEOUT_MS;
    
    let fetchedJob = await getScanJobByIdServerAction(job.id);
    
    while (fetchedJob.status !== "PARSED" && fetchedJob.status !== "FAILED") {
      if (Date.now() >= deadline) {
        return { success: false, error: "Scan timed out. Please try again." };
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      fetchedJob = await getScanJobByIdServerAction(job.id);
    }

    if (fetchedJob.status === "FAILED") {
      return { success: false, error: "Scan failed. Please try again." };
    }

    // 5. Fetch results & cleanup
    const findings = await getFindingsByJobIdServerAction(job.id);
    
    // Deleting the token after a one-off scan is a fantastic security practice!
    await clearScanJobToken(job.id);

    return {
      success: true,
      findings,
      jobs: [fetchedJob]
    };

  } catch (error: any) {
    console.error("Scan error:", error);
    return { success: false, error: "Scan failed. Please try again." };
  }
}