"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { SubmitButton } from "./SubmitButton";
import { ScanJob } from "@/lib/repository/scanJob/scanJobSchemas";
import { ScanFinding } from "@/lib/repository/scanFinding/scanFindingSchema";
import { useScanAction } from "@/lib/hooks/useScanAction";
import { Search, Lock } from "lucide-react";

export const urlFormSchema = z.object({
  url: z.url("Invalid url"),
  repoType: z.enum(["public", "private"]),
  repoKey: z.string().optional(),
});

export type URLFormSchema = z.infer<typeof urlFormSchema>;

interface URLFormProps {
  onScanStarted: (finding: ScanFinding[], jobs: ScanJob[]) => void;
  isDeepScan: boolean;
  extensions: Set<string>;
  isRepoKey: boolean;
}

export default function URLForm({ onScanStarted, isDeepScan, extensions, isRepoKey }: URLFormProps) {
  const { execute, isPending } = useScanAction();

  const form = useForm<URLFormSchema>({
    resolver: zodResolver(urlFormSchema),
    defaultValues: {
      url: "",
      repoType: "public",
      repoKey: "",
    },
  });

  const repoType = form.watch("repoType");

  useEffect(() => {
    if (!isRepoKey && repoType === "private") {
      form.setValue("repoType", "public");
    }
  }, [isRepoKey, repoType, form]);

  const onSubmit = form.handleSubmit(async (data) => {
    const input = {
      url: data.url,
      repo_url: data.url,
      token: (isRepoKey && data.repoType === "private") ? data.repoKey : null,
      owner_id: null,
      priority: 1,
      isDeepScan,
      extensions,
    };

    const result = await execute(input);
    if (result.success) {
      onScanStarted(result.findings, result.jobs);
    }
  });

  return (
    <div className="w-full max-w-2xl bg-box border border-border rounded-[14px] p-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-5 w-full">

        {/* ROW 1: Repo type toggle */}
        <div className="flex items-center gap-4">
          <span className="text-secondary text-[10px] tracking-[0.14em] uppercase font-mono mt-0.5">
            Repository type
          </span>
          <div className="flex border border-border rounded-lg overflow-hidden">
            {(["public", "private"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  if (type === "private" && !isRepoKey) return;
                  form.setValue("repoType", type);
                }}
                disabled={type === "private" && !isRepoKey}
                className={`
                  px-4 py-1.5 text-xs font-mono capitalize transition-all outline-none border-r border-border last:border-r-0
                  ${repoType === type
                    ? "bg-secondary/20 text-text-main"
                    : "bg-transparent text-secondary hover:bg-background/50"}
                  disabled:opacity-40 disabled:cursor-not-allowed
                `}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* ROW 2: URL input and Submit button */}
        <div className="flex items-center gap-3 w-full">
          <div className="relative flex-1 min-w-0 group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search
                width={16}
                height={16}
                className="text-secondary group-focus-within:text-text-main transition-colors"
                strokeWidth={2}
              />
            </div>
            <input
              id="url"
              type="text"
              {...form.register("url")}
              onChange={() => form.clearErrors("url")}
              placeholder="Paste a Git repository URL..."
              className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-3 outline-none text-text-main placeholder:text-secondary/70 font-mono text-sm focus:border-button-main transition-colors"
            />
          </div>

          <div className="shrink-0">
            <SubmitButton
              text="Start Scanning"
              loadingText="Scanning..."
              loading={isPending}
            />
          </div>
        </div>

        {/* URL error */}
        {form.formState.errors.url && (
          <p className="text-xs text-destructive font-mono -mt-3 ml-1">
            {form.formState.errors.url.message}
          </p>
        )}

        {/* Private repo key input */}
        {isRepoKey && repoType === "private" && (
          <div className="relative w-full mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none pb-[26px]">
              <Lock width={15} height={15} className="text-secondary" strokeWidth={2} />
            </div>
            <input
              id="repoKey"
              type="password"
              {...form.register("repoKey")}
              placeholder="Enter your personal access token..."
              className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-3 outline-none text-text-main placeholder:text-secondary/70 font-mono text-sm focus:border-button-main transition-colors"
            />
            <p className="text-[11px] text-secondary font-mono mt-2 ml-1">
              Your token is encrypted and used only for this scan.
            </p>
          </div>
        )}

      </form>
    </div>
  );
}