"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GitPullRequest } from "lucide-react";
import { toast } from "sonner";
import { SubmitButton } from "@/app/_components/SubmitButton";
import { newListeningRepo } from "./newListeningRepo";
import { createListeningRepositoryFormSchema } from "@/lib/repository/listeningRepository/listeningRepositorySchema";
import { RepoSignupData, ManagedListeningRepository } from "./repoTypes";
import { BranchListInput } from "./BranchListInput";
import { useState } from "react";

export function CreateRepoForm({
  onRepoCreated,
}: {
  onRepoCreated: (repo: ManagedListeningRepository) => void;
}) {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<RepoSignupData>({
    resolver: zodResolver(createListeningRepositoryFormSchema),
    defaultValues: {
      repoUrl: "",
      webhookSecret: "",
      branch_config: "DEFAULT",
      branches: [],
    },
  });

  const branchConfig = form.watch("branch_config");
  const selectedBranches = form.watch("branches") ?? [];

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsPending(true);

    try {
      if (
        data.branch_config === "CUSTOM" &&
        (!data.branches || data.branches.length === 0)
      ) {
        form.setError("branches", {
          type: "manual",
          message: "Add at least one branch to scan.",
        });
        return;
      }

      if (data.branch_config !== "CUSTOM") {
        data.branches = [];
      }

      const result = await newListeningRepo(data);

      if (result?.id) {
        toast.success(result.message);

        onRepoCreated({
          id: result.id,
          repo_url: data.repoUrl,
          webhook_secret: data.webhookSecret,
          branch_config: data.branch_config,
          branches: data.branches,
          is_active: true,
        } as ManagedListeningRepository);

        form.reset({
          repoUrl: "",
          webhookSecret: "",
          branch_config: "DEFAULT",
          branches: [],
        });
      } else {
        toast.error(result?.message || "Failed to register repository");
      }
    } catch {
      toast.error("Unexpected error while connecting repository.");
    } finally {
      setIsPending(false);
    }
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-mono text-secondary uppercase tracking-widest block mb-2">
          Repository URL
        </label>
        <div className="flex gap-2 items-center">
          <GitPullRequest className="text-secondary" size={18} />
          <input
            type="text"
            placeholder="https://github.com/yourname/your-repo"
            {...form.register("repoUrl")}
            className="field flex-1 px-3 py-2 font-mono text-sm border border-secondary/20 bg-text-main/5 rounded-md focus:ring-2 focus:ring-button-main/30 focus:border-button-main/40 outline-none transition-all"
            disabled={isPending}
          />
        </div>
        {form.formState.errors.repoUrl && (
          <p className="text-destructive text-xs mt-1 font-mono">
            {form.formState.errors.repoUrl.message}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-mono text-secondary uppercase tracking-widest block">
          Branch scan mode
        </label>

        <div className="grid grid-cols-3 gap-2 rounded-md border border-secondary/20 p-1 bg-text-main/5">
          <button
            type="button"
            onClick={() => {
              form.setValue("branch_config", "DEFAULT", {
                shouldValidate: true,
                shouldDirty: true,
              });
              form.setValue("branches", [], {
                shouldValidate: true,
                shouldDirty: true,
              });
              form.clearErrors("branches");
            }}
            disabled={isPending}
            className={`rounded-md px-3 py-2 text-xs font-mono uppercase tracking-widest transition-all ${
              branchConfig === "DEFAULT"
                ? "bg-button-main/15 text-text-main border border-button-main/30"
                : "text-secondary"
            }`}
          >
            Default branch
          </button>

          <button
            type="button"
            onClick={() => {
              form.setValue("branch_config", "ALL", {
                shouldValidate: true,
                shouldDirty: true,
              });
              form.setValue("branches", [], {
                shouldValidate: true,
                shouldDirty: true,
              });
              form.clearErrors("branches");
            }}
            disabled={isPending}
            className={`rounded-md px-3 py-2 text-xs font-mono uppercase tracking-widest transition-all ${
              branchConfig === "ALL"
                ? "bg-button-main/15 text-text-main border border-button-main/30"
                : "text-secondary"
            }`}
          >
            Scan all branches
          </button>

          <button
            type="button"
            onClick={() =>
              form.setValue("branch_config", "CUSTOM", {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            disabled={isPending}
            className={`rounded-md px-3 py-2 text-xs font-mono uppercase tracking-widest transition-all ${
              branchConfig === "CUSTOM"
                ? "bg-button-main/15 text-text-main border border-button-main/30"
                : "text-secondary"
            }`}
          >
            Selected branches
          </button>
        </div>

        <p className="uppercase text-[10px] font-mono text-secondary tracking-widest block">
          Choose whether to scan the default branch, all branches, or only
          selected branches
        </p>
      </div>

      {branchConfig === "CUSTOM" && (
        <BranchListInput
          value={selectedBranches}
          onChange={(next) => {
            form.setValue("branches", next, {
              shouldValidate: true,
              shouldDirty: true,
            });

            if (next.length > 0) {
              form.clearErrors("branches");
            }
          }}
          disabled={isPending}
          error={form.formState.errors.branches?.message}
        />
      )}

      <div className="space-y-2">
        <label className="text-[10px] font-mono text-secondary uppercase tracking-widest block mb-2">
          Webhook secret (optional)
        </label>
        <input
          type="text"
          placeholder="Used to validate push events"
          {...form.register("webhookSecret")}
          className="field w-full px-3 py-2 font-mono text-sm border border-secondary/20 bg-text-main/5 rounded-md focus:ring-2 focus:ring-button-main/30 focus:border-button-main/40 outline-none transition-all"
          disabled={isPending}
        />
        <p className="uppercase text-[10px] font-mono text-secondary tracking-widest block">
          We'll store the secret securely using modern encryption
        </p>
      </div>

      <SubmitButton
        text="Register repository"
        loadingText="Registering..."
        loading={isPending}
      />
    </form>
  );
}
