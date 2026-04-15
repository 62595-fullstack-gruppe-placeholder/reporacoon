"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  Loader2,
  PauseCircle,
  PlayCircle,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  deactivateListeningRepo,
  deleteListeningRepo,
  reactivateListeningRepo,
  updateListeningRepo,
} from "./repoActions";
import {
  ExistingRepoEditorData,
  ManagedListeningRepository,
} from "./repoTypes";
import { BranchListInput } from "./BranchListInput";

const existingRepoEditorSchema = z.object({
  branch_config: z.enum(["DEFAULT", "ALL", "CUSTOM"]),
  branches: z.array(z.string()),
});

export function ExistingRepoCard({
  repo,
  onRepoUpdated,
  onRepoDeleted,
}: {
  repo: ManagedListeningRepository;
  onRepoUpdated: (
    repoId: string,
    updates: Partial<ManagedListeningRepository>,
  ) => void;
  onRepoDeleted: (repoId: string) => void;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<ExistingRepoEditorData>({
    resolver: zodResolver(existingRepoEditorSchema),
    defaultValues: {
      branch_config: repo.branch_config ?? "DEFAULT",
      branches: repo.branches,
    },
  });

  const branchConfig = form.watch("branch_config");
  const selectedBranches = form.watch("branches") ?? [];
  const isActive = repo.is_active ?? true;
  const isBusy = isSaving || isTogglingActive || isDeleting;

  useEffect(() => {
    form.reset({
      branch_config: repo.branch_config ?? "DEFAULT",
      branches: repo.branches ?? [],
    });
  }, [repo.branch_config, repo.branches, form]);

  const handleSave = form.handleSubmit(async (data) => {
    if (data.branch_config === "CUSTOM" && data.branches.length === 0) {
      form.setError("branches", {
        type: "manual",
        message: "Add at least one branch to scan.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        id: String(repo.id),
        branch_config: data.branch_config,
        branches: data.branch_config === "CUSTOM" ? data.branches : [],
      };

      const result = await updateListeningRepo(payload);

      if (result.success) {
        onRepoUpdated(String(repo.id), {
          branch_config: payload.branch_config,
          branches: payload.branches,
        });
        toast.success(result.message);
      } else {
        toast.error("Failed to update repository.");
      }
    } catch {
      toast.error("Unexpected error while updating repository.");
    } finally {
      setIsSaving(false);
    }
  });

  const handleToggleActive = async () => {
    setIsTogglingActive(true);

    try {
      const result = isActive
        ? await deactivateListeningRepo({ id: repo.id })
        : await reactivateListeningRepo({ id: repo.id });

      if (result.success) {
        onRepoUpdated(String(repo.id), {
          is_active: result.repo.is_active,
        });
        toast.success(result.message);
      } else {
        toast.error("Failed to change repository status.");
      }
    } catch {
      toast.error("Unexpected error while changing repository status.");
    } finally {
      setIsTogglingActive(false);
    }
  };

  const handleDelete = async () => {
    if (isActive) {
      toast.error("Deactivate the repository before deleting it.");
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteListeningRepo({ id: repo.id });

      if (result.success) {
        onRepoDeleted(String(repo.id));
        toast.success(result.message);
      } else {
        toast.error("Failed to delete repository.");
      }
    } catch {
      toast.error("Unexpected error while deleting repository.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-md border border-secondary/20 bg-text-main/5 p-4 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-text-main font-mono text-sm break-all">
            <CheckCircle2
              size={14}
              className={isActive ? "text-button-main" : "text-secondary"}
            />
            {repo.repo_url}
          </div>

          <div className="flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-widest">
            <span
              className={`rounded px-2 py-1 border ${
                isActive
                  ? "text-green-700 border-green-700/20 bg-green-700/10"
                  : "text-secondary border-secondary/20 bg-transparent"
              }`}
            >
              {isActive ? "Active" : "Deactivated"}
            </span>

            <span className="rounded px-2 py-1 border border-secondary/20 text-secondary">
              {repo.branch_config ?? "DEFAULT"}
            </span>

            {repo.branch_config === "CUSTOM" &&
              (repo.branches?.length ?? 0) > 0 && (
                <span className="rounded px-2 py-1 border border-secondary/20 text-secondary">
                  {repo.branches?.length} selected branch
                  {repo.branches?.length === 1 ? "" : "es"}
                </span>
              )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleToggleActive}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-md border border-secondary/20 px-3 py-2 text-xs font-mono uppercase tracking-widest text-text-main disabled:opacity-50"
          >
            {isTogglingActive ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isActive ? (
              <PauseCircle size={14} />
            ) : (
              <PlayCircle size={14} />
            )}
            {isActive ? "Deactivate" : "Re-activate"}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isBusy || isActive}
            className="inline-flex items-center gap-2 rounded-md border border-destructive/30 px-3 py-2 text-xs font-mono uppercase tracking-widest text-destructive disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Delete
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-3">
          <label className="text-[10px] font-mono text-secondary uppercase tracking-widest block">
            Branch scan mode
          </label>

          <div className="grid grid-cols-3 gap-2 rounded-md border border-secondary/20 p-1 bg-background/30">
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
              disabled={isBusy || !isActive}
              className={`rounded-md px-3 py-2 text-xs font-mono uppercase tracking-widest transition-all ${
                branchConfig === "DEFAULT"
                  ? "bg-button-main/15 text-text-main border border-button-main/30"
                  : "text-secondary"
              }`}
            >
              Default
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
              disabled={isBusy || !isActive}
              className={`rounded-md px-3 py-2 text-xs font-mono uppercase tracking-widest transition-all ${
                branchConfig === "ALL"
                  ? "bg-button-main/15 text-text-main border border-button-main/30"
                  : "text-secondary"
              }`}
            >
              All
            </button>

            <button
              type="button"
              onClick={() =>
                form.setValue("branch_config", "CUSTOM", {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              disabled={isBusy || !isActive}
              className={`rounded-md px-3 py-2 text-xs font-mono uppercase tracking-widest transition-all ${
                branchConfig === "CUSTOM"
                  ? "bg-button-main/15 text-text-main border border-button-main/30"
                  : "text-secondary"
              }`}
            >
              Custom
            </button>
          </div>

          {!isActive && (
            <p className="text-xs font-mono text-secondary">
              Deactivated repositories are read-only. Re-activate to edit
              settings.
            </p>
          )}
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
            disabled={isBusy || !isActive}
            error={form.formState.errors.branches?.message}
          />
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isBusy || !isActive}
            className="inline-flex items-center gap-2 rounded-md border border-button-main/30 bg-button-main/10 px-3 py-2 text-xs font-mono uppercase tracking-widest text-text-main disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
