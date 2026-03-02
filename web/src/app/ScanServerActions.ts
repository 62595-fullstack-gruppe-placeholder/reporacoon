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
