"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleHelp, GitPullRequest, Lock } from "lucide-react";
import { toast } from "sonner";
import { SubmitButton } from "@/app/_components/SubmitButton";
import { newListeningRepo } from "./newListeningRepo";
import { createListeningRepositoryFormSchema } from "@/lib/repository/listeningRepository/listeningRepositorySchema";
import { RepoSignupData, ManagedListeningRepository } from "./repoTypes";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
      repoType: "public",
      repoKey: "",
    },
  });

  const branchConfig = form.watch("branch_config");
  const repoType = form.watch("repoType");

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsPending(true);

    try {
      const result = await newListeningRepo(data);

      if (result?.id) {
        toast.success(result.message);

        onRepoCreated({
          id: result.id,
          repo_url: data.repoUrl,
          webhook_secret: data.webhookSecret,
          repoKey: data.repoKey,
          branch_config: data.branch_config,
          is_active: true,
        } as ManagedListeningRepository);

        form.reset({
          repoUrl: "",
          webhookSecret: "",
          branch_config: "DEFAULT",
          repoType: "public",
          repoKey: "",
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
      <div className="flex items-center gap-4">
        <span className="text-secondary text-[10px] tracking-[0.14em] uppercase font-mono mt-0.5">
          Repository type
        </span>
        <div className="flex border border-border rounded-lg overflow-hidden">
          {(["public", "private"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => form.setValue("repoType", type)}
              className={`px-4 py-1.5 text-xs font-mono capitalize transition-all outline-none border-r border-border last:border-r-0 ${
                repoType === type
                  ? "bg-secondary/20 text-text-main"
                  : "bg-transparent text-secondary hover:bg-background/50"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

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

      {repoType === "private" && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <label className="text-[10px] font-mono text-secondary uppercase tracking-widest block">
            Personal access token
          </label>
          <div className="flex gap-2 items-center">
            <Lock width={15} height={15} className="text-secondary" strokeWidth={2} />
            <input
              type="password"
              {...form.register("repoKey")}
              placeholder="Enter your personal access token"
            className="field flex-1 px-3 py-2 font-mono text-sm border border-secondary/20 bg-text-main/5 rounded-md focus:ring-2 focus:ring-button-main/30 focus:border-button-main/40 outline-none transition-all"
              disabled={isPending}
            /> 
          </div>
          <p className="uppercase text-[10px] font-mono text-secondary tracking-widest">
            Your token is encrypted and used only for this repository.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <label className="text-[10px] font-mono text-secondary uppercase tracking-widest block">
          Branch scan mode
        </label>
        <div className="flex gap-2 rounded-md border border-secondary/20 p-1 bg-text-main/5">
          <button
            type="button"
            onClick={() => form.setValue("branch_config", "DEFAULT", { shouldValidate: true, shouldDirty: true })}
            disabled={isPending}
            className={`flex-1 whitespace-nowrap rounded-md px-3 py-2 text-xs font-mono uppercase tracking-widest transition-all ${
              branchConfig === "DEFAULT"
                ? "bg-button-main/15 text-text-main border border-button-main/30"
                : "text-secondary"
            }`}
          >
            Default branch
          </button>
          <button
            type="button"
            onClick={() => form.setValue("branch_config", "ALL", { shouldValidate: true, shouldDirty: true })}
            disabled={isPending}
            className={`flex-1 whitespace-nowrap rounded-md px-3 py-2 text-xs font-mono uppercase tracking-widest transition-all ${
              branchConfig === "ALL"
                ? "bg-button-main/15 text-text-main border border-button-main/30"
                : "text-secondary"
            }`}
          >
            Scan all branches
          </button>
        </div>
        <div className="space-y-2">
          <p className="uppercase text-[10px] font-mono text-secondary tracking-widest block">
            Choose whether to scan the default branch or all branches
          </p>
          <Button
            asChild
            type="button"
            variant="outline"
            className="w-full justify-center border-secondary/20 bg-transparent font-mono text-[10px] uppercase tracking-widest text-secondary hover:bg-text-main/5 hover:text-text-main"
          >
            <Link href={process.env.NEXT_PUBLIC_APP_URL + "/dashboard/automatic/howto"} target="_blank">
              <CircleHelp size={14} />
              Webhook setup guide
            </Link>
          </Button>
        </div>
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
