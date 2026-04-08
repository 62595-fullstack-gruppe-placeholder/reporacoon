"use client";

import { useState } from "react";
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

export default function RepoSignupForm({
  existingRepos,
}: {
  existingRepos: ListeningRepository[];
}) {
  const [isPending, setIsPending] = useState(false);
  const form = useForm<RepoSignupData>({
    resolver: zodResolver(createListeningRepositoryFormSchema),
    defaultValues: { repoUrl: "", webhookSecret: "" },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsPending(true);
    try {
      const result = await newListeningRepo(data);

      if (result && result.id) {
        toast.success(result.message);
        form.reset();
      } else {
        toast.error(result?.message || "Failed to register repository");
      }
    } catch (err) {
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
