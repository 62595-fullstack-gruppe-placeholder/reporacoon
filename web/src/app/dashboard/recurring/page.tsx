import { getUser } from "@/lib/auth/userFromToken";
import { getRecursiveScansByOwner } from "@/lib/repository/recursiveScan/recursiveScanRepository";
import { RecurringForm } from "./RecurringForm";
import { getScanSettings } from "@/app/ScanSettingsServerActions";

export const dynamic = "force-dynamic";

export default async function RecurringPage() {
  const user = await getUser();
   if (!user) {
    throw new Error("Authentication required");
  }

  const initialSettings = await getScanSettings()
    if (!initialSettings) {
      return null;
    }

  const scans = await getRecursiveScansByOwner(user!.id);


  return (
    <div className="w-full">
      <div className="space-y-8 w-3/4 mx-auto mt-8">
        <RecurringForm initialScans={scans} isDeep={initialSettings.isDeep} extensions={new Set<string>(initialSettings.extensions)}  />
      </div>
    </div>
  );
}
