"use server";

import { getUser } from "@/lib/auth/userFromToken";
import { getFindingsByJobId } from "@/lib/repository/scanFinding/scanFindingRepository";
import { ScanFinding } from "@/lib/repository/scanFinding/scanFindingSchema";
import { createScanJob, getScanJobById } from "@/lib/repository/scanJob/scanJobRepository";
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

export async function scan(input: CreateScanJobDTO & { url: string; isDeepScan: boolean }): Promise<ScanResult> {
  try {
    // 1. Validate URL with Python service
    const validateResponse = await fetch("http://scraper:5001/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: input.url }),
    });

    const validateData = await validateResponse.json();

    if (!validateData.valid) {
      return { 
        success: false, 
        error: "Invalid GitHub/GitLab URL. Please check and try again." 
      };
    }

    // 2. Create scan job
    await createScanJobServerAction({
      repo_url: input.url,
      owner_id: (await getUser())?.id ?? null,
      priority: 1,
    });

    // 3. Start scanner
    const scanResponse = await fetch("http://scraper:5001/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDeepScan: input.isDeepScan }),
    });

    const scanData = await scanResponse.json();
    const scanId = scanData.scan_id;

    // 4. Fetch results
    const findings = await getFindingsByJobIdServerAction(scanId);
    const job = await getScanJobByIdServerAction(scanId);

    return {
      success: true,
      findings,
      jobs: [job]
    };

  } catch (error: any) {
    console.error("Scan error:", error);
    return { 
      success: false, 
      error: "Scan failed. Please try again." 
    };
  }
}