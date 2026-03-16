"use server";

import { getScanFindingById } from "@/lib/repository/scanFinding/scanFindingRepository";
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
 * Gets the scan finding from the database by the given id
 * @param id the id of the scan finding to fetch
 * @returns returns the scan finding of the given id
 */
export async function getScanFindingByIdServerAction(id: String): Promise<ScanFinding[]> {
  const scanFindings: ScanFinding[] = await getScanFindingById(id);
  return scanFindings
}

/**
 * Gets the scan job from the database by the given id
 * @param id the id of the scan job to fetch
 * @returns returns the scan job of the given id
 */
export async function getScanJobByIdServerAction(id: String): Promise<ScanJob> {
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

export async function scan(input: CreateScanJobDTO & { url: string; isDeepScan: boolean; extensions: Set<string> }): Promise<ScanResult> {
  try {
    // 1. Validate URL with Python service
    const validateResponse = await fetch("http://host.docker.internal:5001/validate", {
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
    const scanJob = await createScanJobServerAction({
      repo_url: input.url,
      owner_id: null, // TODO: get from session/cookie
      priority: 1,
    });

    // 3. Start scanner
    const scanResponse = await fetch("http://host.docker.internal:5001/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDeepScan: input.isDeepScan, extensions: input.extensions }),
    });

    const scanData = await scanResponse.json();
    const scanId = scanData.scan_id;

    // 4. Fetch results
    const findings = await getScanFindingByIdServerAction(scanId);
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