"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { SubmitButton } from "./SubmitButton";
import { ScanJob } from "@/lib/repository/scanJob/scanJobSchemas";
import { ScanFinding } from "@/lib/repository/scanFinding/scanFindingSchema";
import { useScanAction } from "@/lib/hooks/useScanAction";

/**
 * Schema for url form.
 */
export const urlFormSchema = z.object({
  url: z.url("Invalid url"),
});

/**
 * URL form data.
 */
export type URLFormSchema = z.infer<typeof urlFormSchema>;

type URLFormProps = {
  onScanStarted: (finding: ScanFinding[], jobs: ScanJob[]) => void;
  isDeepScan: boolean;
};

export default function URLForm(props: URLFormProps) {
  const { execute, isPending } = useScanAction();
  const form = useForm<URLFormSchema>({
    resolver: zodResolver(urlFormSchema),
    defaultValues: { url: "" },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    const input = {
      url: data.url,
      repo_url: data.url,
      owner_id: null,
      priority: 1,
      isDeepScan: props.isDeepScan,
    };

    const result = await execute(input);

    if (result.success) {
      props.onScanStarted(result.findings, result.jobs);
    }
    // Error: toast shows automatically via useServerAction
  });

  return (
    <form onSubmit={onSubmit} className="flex items-center flex-1 w-full gap-8">
      <input
        id="url"
        type="text"
        {...form.register("url")}
        onChange={() => form.clearErrors("url")}
        className="fieldText flex-1 min-w-0 w-full bg-transparent outline-none truncate"
        placeholder="Paste a GitHub/GitLab URL"
      />
      {form.formState.errors.url && (
        <p className="mt-1 text-sm text-red-600">
          {form.formState.errors.url.message}
        </p>
      )}
      <SubmitButton
        text="Start Scanning"
        loadingText="Scanning..."
        loading={isPending}
      />
    </form>
  );
}
