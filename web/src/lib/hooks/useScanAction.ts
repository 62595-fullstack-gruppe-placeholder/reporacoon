"use client";
import { useTransition, useCallback } from "react";
import { toast } from "sonner";
import { scan, ScanResult } from "@/app/ScanServerActions";


// Specific hook used for the scan server action. This is seperate due to the return type of the scan server action.
export function useScanAction() {
  const [isPending, startTransition] = useTransition();

  const execute = useCallback(async (input: Parameters<typeof scan>[0]): Promise<ScanResult> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        const result = await scan(input);
        if (!result.success) {
          toast.error(result.error);
        }  else {
          toast.success("Scan started successfully!");
        }
        resolve(result);
      });
    });
  }, []);

  return { execute, isPending };
}