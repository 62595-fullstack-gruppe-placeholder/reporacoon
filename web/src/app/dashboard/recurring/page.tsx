import { getUser } from "@/lib/auth/userFromToken";
import { getRecursiveScansByOwner } from "@/lib/repository/recursiveScan/recursiveScanRepository";
import { RecurringForm } from "./RecurringForm";

export const dynamic = "force-dynamic";

export default async function RecurringPage() {
  const user = await getUser();
  if (!user) throw new Error("Authentication required");

  const scans = await getRecursiveScansByOwner(user.id);

  return (
    <div className="w-full">
      <div className="space-y-8 w-3/4 mx-auto mt-8">
        <RecurringForm initialScans={scans} />
      </div>
    </div>
  );
}
