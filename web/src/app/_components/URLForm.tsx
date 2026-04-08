"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { SubmitButton } from "./SubmitButton";
import { ScanJob } from "@/lib/repository/scanJob/scanJobSchemas";
import { ScanFinding } from "@/lib/repository/scanFinding/scanFindingSchema";
import { useScanAction } from "@/lib/hooks/useScanAction";
import { Search } from "lucide-react";

/**
 * Schema for url form.
 */
export const urlFormSchema = z.object({
  url: z.url("Invalid url"),
  repoKey: z.string().optional(),
});

/**
 * URL form data.
 */
export type URLFormSchema = z.infer<typeof urlFormSchema>;


interface URLFormProps {
    onScanStarted: (finding: ScanFinding[], jobs: ScanJob[]) => void;
    isDeepScan: boolean;
    extensions: Set<string>
}


export default function URLForm({ onScanStarted, isDeepScan, extensions}: URLFormProps) {
    const { execute, isPending } = useScanAction();

    const form = useForm<URLFormSchema>({
      resolver: zodResolver(urlFormSchema),
      defaultValues: { 
        url: "",
        repoKey: ""
      },
    });

    const onSubmit = form.handleSubmit(async (data) => {
        const input = {
            url: data.url,
            repo_url: data.url,
            token: data.repoKey,
            owner_id: null,
            priority: 1,
            isDeepScan,
            extensions,
        };
        console.log(extensions)
        const result = await execute(input);

    if (result.success) {
      onScanStarted(result.findings, result.jobs);
    }
    // Error: toast shows automatically via useServerAction
  });

  return (
    <div className="field flex items-center gap-2">
      <Search width={20} height={20} color="#a1b5a6" strokeWidth={2} />

      <form
        onSubmit={onSubmit}
        className="flex items-center flex-1 w-full gap-8"
      >
        <input
          id="url"
          type="text"
          {...form.register("url")}
          onChange={() => form.clearErrors("url")}
          className="fieldText flex-1 min-w-0 w-full bg-transparent outline-none truncate"
          placeholder="Paste a public Git repository URL"
        />
        {form.formState.errors.url && (
          <p className="mt-1 text-sm text-red-600">
            {form.formState.errors.url.message}
          </p>
        )}
        <SubmitButton
          text="Start scan"
          loadingText="Scanning..."
          loading={isPending}
        />
        <input 
          id="repoKey"
          type="text"
          {...form.register("repoKey")}
          className="fieldText flex-1 min-w-0 w-full bg-transparent outline-none truncate"
          placeholder="Paste the corroponding token to the repo"
        />
      </form>
    </div>
  );
}
