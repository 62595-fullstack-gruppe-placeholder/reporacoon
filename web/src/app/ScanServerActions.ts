"use server";

import { getUser } from "@/lib/auth/userFromToken";
import { encryptToken } from "@/lib/crypto";
import { getFindingsByJobId } from "@/lib/repository/scanFinding/scanFindingRepository";
import { ScanFinding } from "@/lib/repository/scanFinding/scanFindingSchema";
import { clearScanJobToken, createScanJob, getScanJobById } from "@/lib/repository/scanJob/scanJobRepository";
import { CreateScanJobDTO, createScanJobDTOSchema, ScanJob } from "@/lib/repository/scanJob/scanJobSchemas";

/**
 * Create scan job server action.
 * @param input see {@link CreateScanJobDTO}.
 */
export async function createScanJobServerAction(input: CreateScanJobDTO) {
  const scanjob = await createScanJob(
    createScanJobDTOSchema.parse({
      repo_url: input.repo_url,
      owner_id: input.owner_id,
      repoKey: input.repoKey,
      priority: input.priority,
    }),
  );
  return scanjob
}

/**
 * Get scan findings for a given job.
 * @param id if of the job for which to get findings.
 * @returns a promise of an array of findings.
 */
export async function getFindingsByJobIdServerAction(jobId: string): Promise<ScanFinding[]> {
  const scanFindings: ScanFinding[] = await getFindingsByJobId(jobId);
  return scanFindings
}

/**
 * Gets the scan job from the database by the given id
 * @param id the id of the scan job to fetch
 * @returns returns the scan job of the given id
 */
export async function getScanJobByIdServerAction(id: string): Promise<ScanJob> {
  const scanJob: ScanJob = await getScanJobById(id);
  return scanJob
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
    // 1. Validate URL with Python service
    const validateResponse = await fetch("http://scraper:5001/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        url: input.url,
        repoKey: input.repoKey,
      }),
    });

    const validateText = await validateResponse.text();
    let validateData;

    try {
      validateData = JSON.parse(validateText);
    } catch {
      console.error("Non-JSON response from /validate:", validateText);
      return { success: false, error: "Validation service returned an invalid response." };
    }

    if (!validateResponse.ok || !validateData.valid) {
      console.log("Validation failed:", validateData);
      return { success: false, error: validateData.message ?? "Invalid GitHub/GitLab URL. Please check and try again." };
    }

    

    const repokeyEncrypted = input.repoKey != null ? encryptToken(input.repoKey) : null;
    const job = await createScanJobServerAction({
      repo_url: input.url,
      owner_id: (await getUser())?.id ?? null,
      repoKey: repokeyEncrypted,
      priority: 1,
    });

    const scanResponse = await fetch("http://scraper:5001/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        isDeepScan: input.isDeepScan, 
        extensions: Array.from(input.extensions),
        repoKey: input.repoKey, 
      }),
    });

    const scanData = await scanResponse.json();
    const scanId = scanData.scan_id;


    // 4. Poll until the Celery worker finishes (status transitions PENDING → PARSING → PARSED)
    const POLL_INTERVAL_MS = 2000;
    const TIMEOUT_MS = 5 * 60 * 1000;
    const deadline = Date.now() + TIMEOUT_MS;
    let fetchedJob = await getScanJobByIdServerAction(scanId);
    while (job.status !== "PARSED" && job.status !== "FAILED") {
      if (Date.now() >= deadline) {
        return { success: false, error: "Scan timed out. Please try again." };
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      fetchedJob = await getScanJobByIdServerAction(scanId);
    }

    if (job.status === "FAILED") {
      return { success: false, error: "Scan failed. Please try again." };
    }

    // 5. Fetch results now that the scan is complete
    const findings = await getFindingsByJobIdServerAction(scanId);
    await clearScanJobToken(scanId);

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