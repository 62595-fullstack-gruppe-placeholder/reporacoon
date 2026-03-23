"use server";

import { getUser } from "@/lib/auth/userFromToken";
import {
  createRecursiveScan,
  deleteRecursiveScan,
  toggleRecursiveScan,
} from "@/lib/repository/recursiveScan/recursiveScanRepository";
import { createRecursiveScanDTOSchema, ScanInterval } from "@/lib/repository/recursiveScan/recursiveScanSchema";
import { getScanJobsByRecursiveScanId } from "@/lib/repository/scanJob/scanJobRepository";
import { getFindingsByJobId } from "@/lib/repository/scanFinding/scanFindingRepository";
import { revalidatePath } from "next/cache";

export async function createRecursiveScanAction(url: string, interval: ScanInterval, isDeepScan: boolean) {
  const user = await getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const input = createRecursiveScanDTOSchema.parse({
    repo_url: url,
    owner_id: user.id,
    interval,
    is_deep_scan: isDeepScan,
  });

  // Validate with scraper before saving
  const validateRes = await fetch("http://scraper:5001/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const validateData = await validateRes.json();
  if (!validateData.valid) return { success: false, error: "Invalid GitHub URL" };

  // Tell the scraper to schedule the recurring scan (kicks off first run immediately)
  await fetch("http://scraper:5001/recursive-scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, interval, isDeepScan }),
  });

  await createRecursiveScan(input);

  revalidatePath("/dashboard/recurring");
  return { success: true };
}

export async function deleteRecursiveScanAction(id: string) {
  const user = await getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  await deleteRecursiveScan(id, user.id);

  revalidatePath("/dashboard/recurring");
  return { success: true };
}

export async function toggleRecursiveScanAction(id: string) {
  const user = await getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const isActive = await toggleRecursiveScan(id, user.id);

  revalidatePath("/dashboard/recurring");
  return { success: true, is_active: isActive };
}

export async function getRecurringScanResultsAction(recursiveScanId: string) {
  const user = await getUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const jobs = await getScanJobsByRecursiveScanId(recursiveScanId);
  const findings = (await Promise.all(jobs.map((j) => getFindingsByJobId(j.id)))).flat();

  return { success: true as const, jobs, findings };
}

export async function runRecursiveScanNowAction(scraperId: string) {
  const user = await getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const res = await fetch(`http://scraper:5001/recursive-scan/${scraperId}/run-now`, {
    method: "POST",
  });
  if (!res.ok) return { success: false, error: "Failed to trigger scan" };

  revalidatePath("/dashboard/recurring");
  return { success: true };
}
