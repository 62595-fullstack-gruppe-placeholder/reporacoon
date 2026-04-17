"use server";

import { getUser } from "@/lib/auth/userFromToken";
import {
  createRecursiveScan,
  deleteRecursiveScan,
  toggleRecursiveScan,
  getRecursiveScanById,
} from "@/lib/repository/recursiveScan/recursiveScanRepository";
import { createRecursiveScanDTOSchema, ScanInterval } from "@/lib/repository/recursiveScan/recursiveScanSchema";
import { getScanJobsByRecursiveScanId } from "@/lib/repository/scanJob/scanJobRepository";
import { getFindingsByJobId } from "@/lib/repository/scanFinding/scanFindingRepository";
import { revalidatePath } from "next/cache";
import { encryptToken, decryptToken } from "@/lib/crypto"; 

export async function createRecursiveScanAction(
  url: string, 
  interval: ScanInterval, 
  isDeepScan: boolean, 
  extensions: Set<string>,
  repoKey: string | null = null
) {
  const user = await getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const extensionsArray = Array.from(extensions);

  // Validate with scraper using the RAW token before saving
  const validateRes = await fetch("http://scraper:5001/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, repoKey }),
  });
  const validateData = await validateRes.json();
  if (!validateData.valid) return { success: false, error: "Invalid GitHub URL or access token" };

  const repokeyEncrypted = repoKey != null ? encryptToken(repoKey) : null;  
  const input = createRecursiveScanDTOSchema.parse({
    repo_url: url,
    owner_id: user.id,
    repoKey: repokeyEncrypted,
    interval,
    is_deep_scan: isDeepScan,
    extensions: extensionsArray,
  });

  const newScan = await createRecursiveScan(input);

  await fetch("http://scraper:5001/recursive-scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      id: newScan.id, 
      url: url, 
      repoKey: repoKey, 
      isDeepScan: isDeepScan, 
      extensions: extensionsArray,
      owner_id: user.id
    }),
  });

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

export async function runRecursiveScanNowAction(scanId: string) {
  const user = await getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const scan = await getRecursiveScanById(scanId); 
  if (!scan || scan.owner_id !== user.id) {
    return { success: false, error: "Scan not found or unauthorized" };
  }

  const decryptedKey = scan.repoKey ? decryptToken(scan.repoKey) : null;
  const res = await fetch("http://scraper:5001/recursive-scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: scan.id,
      url: scan.repo_url,
      repoKey: decryptedKey,
      isDeepScan: scan.is_deep_scan,
      extensions: scan.extensions,
      owner_id: user.id
    }),
  });

  if (!res.ok) return { success: false, error: "Failed to trigger scan" };

  revalidatePath("/dashboard/recurring");
  return { success: true };
}