"use server";

import { createScanJob } from "@/lib/repository/scanJob/scanJobRepository";
import { CreateScanJobDTO, createScanJobDTOSchema } from "@/lib/repository/scanJob/scanJobSchemas";
import { cookies } from "next/dist/server/request/cookies";


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
  (await cookies()).set("auth", "true");

  console.log(scanjob)
}