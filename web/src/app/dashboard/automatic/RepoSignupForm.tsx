"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitButton } from "@/app/_components/SubmitButton";
import { toast } from "sonner";
import { CheckCircle2, GitPullRequest } from "lucide-react";
import { newListeningRepo } from "./newListeningRepo";
import {
  createListeningRepositoryFormSchema,
  ListeningRepository,
} from "@/lib/repository/listeningRepository/listeningRepositorySchema";

type RepoSignupData = z.infer<typeof createListeningRepositoryFormSchema>;

const placeholderBranches = [
  "main",
  "develop",
  "staging",
  "release",
  "feature/login-flow",
];

function parseGitHubRepo(url: string) {
  const trimmed = url.trim();

  const match = trimmed.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/i,
  );

  if (!match) return null;

  return {
    owner: match[1],
    repo: match[2],
  };
}

export default function RepoSignupForm({
  existingRepos,
}: {
  existingRepos: ListeningRepository[];
}) {
  const [isPending, setIsPending] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [availableBranches, setAvailableBranches] =
    useState<string[]>(placeholderBranches);

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
  const repoUrl = form.watch("repoUrl");
  const selectedBranches = form.watch("branches") ?? [];

  useEffect(() => {
    if (branchConfig !== "CUSTOM") return;

    const parsed = parseGitHubRepo(repoUrl || "");

    if (!parsed) {
      setAvailableBranches(placeholderBranches);
      form.setValue("branches", [], {
        shouldValidate: true,
        shouldDirty: true,
      });
      return;
    }

    let cancelled = false;

    const fetchBranches = async () => {
      setIsLoadingBranches(true);

      try {
        // Replace this with your own backend proxy if needed for private repos / auth
        const response = await fetch(
          `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/branches?per_page=100`,
          {
            headers: {
              Accept: "application/vnd.github+json",
            },
          },
        );

        if (!response.ok) {
          console.error(await response.json());
          throw new Error("Failed to fetch branches");
        }

        const data = await response.json();

        if (!cancelled) {
          const branchNames = Array.isArray(data)
            ? data
                .map((branch: { name?: string }) => branch.name)
                .filter((name: string | undefined): name is string =>
                  Boolean(name),
                )
            : placeholderBranches;

          setAvailableBranches(
            branchNames.length > 0 ? branchNames : placeholderBranches,
          );

          form.setValue("branches", [], {
            shouldValidate: true,
            shouldDirty: true,
          });
          form.clearErrors("branches");
        }
      } catch {
        if (!cancelled) {
          setAvailableBranches(placeholderBranches);
          toast.error("Could not load GitHub branches.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingBranches(false);
        }
      }
    };

    fetchBranches();

    return () => {
      cancelled = true;
    };
  }, [branchConfig, repoUrl, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsPending(true);

    try {
      if (
        data.branch_config === "CUSTOM" &&
        (!data.branches || data.branches.length === 0)
      ) {
        form.setError("branches", {
          type: "manual",
          message: "Select at least one branch to scan.",
        });
        setIsPending(false);
        return;
      }

      if (data.branch_config !== "CUSTOM") {
        data.branches = [];
      }

      const result = await newListeningRepo(data);

      if (result && result.id) {
        toast.success(result.message);
        setAvailableBranches(placeholderBranches);
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
        <div className="space-y-2">
          <label className="text-[10px] font-mono text-secondary uppercase tracking-widest block mb-2">
            Branches to scan
          </label>

          <select
            multiple
            value={selectedBranches}
            onChange={(event) => {
              const values = Array.from(
                event.target.selectedOptions,
                (option) => option.value,
              );

              form.setValue("branches", values, {
                shouldValidate: true,
                shouldDirty: true,
              });
              form.clearErrors("branches");
            }}
            disabled={isPending || isLoadingBranches}
            className="field w-full min-h-[140px] px-3 py-2 font-mono text-sm border border-secondary/20 bg-text-main/5 rounded-md focus:ring-2 focus:ring-button-main/30 focus:border-button-main/40 outline-none transition-all"
          >
            {availableBranches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>

          <p className="uppercase text-[10px] font-mono text-secondary tracking-widest block">
            {parseGitHubRepo(repoUrl || "")
              ? isLoadingBranches
                ? "Loading branches from GitHub..."
                : "Hold command or ctrl to select multiple branches"
              : "Branch fetching is available for GitHub repository URLs only"}
          </p>

          {form.formState.errors.branches && (
            <p className="text-destructive text-xs mt-1 font-mono">
              {form.formState.errors.branches.message}
            </p>
          )}
        </div>
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
          We'll only store a hash of the secrets
        </p>
      </div>

      <SubmitButton
        text="Register repository"
        loadingText="Registering..."
        loading={isPending}
      />

      {existingRepos?.length > 0 && (
        <div className="pt-6 border-t border-secondary/10">
          <h3 className="text-sm font-bold text-text-main mb-3 font-mono">
            Your registered repositories
          </h3>
          <ul className="space-y-2">
            {existingRepos.map((repo) => (
              <li
                key={repo.id}
                className="flex items-center gap-2 text-sm text-secondary font-mono"
              >
                <CheckCircle2 size={14} className="text-button-main" />
                {repo.repo_url}
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
