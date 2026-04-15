"use client";

import { useEffect, useState } from "react";
import { ListeningRepository } from "@/lib/repository/listeningRepository/listeningRepositorySchema";
import { CreateRepoForm } from "./CreateRepoForm";
import { ExistingReposList } from "./ExistingReposList";
import { ManagedListeningRepository } from "./repoTypes";
function normalizeRepo(repo: ListeningRepository): ManagedListeningRepository {
  const typedRepo = repo as ManagedListeningRepository;

  return {
    ...repo,
    is_active:
      typeof typedRepo.is_active === "boolean" ? typedRepo.is_active : true,
    branch_config: typedRepo.branch_config ?? "DEFAULT",
    branches: typedRepo.branches ?? [],
    webhook_secret: typedRepo.webhook_secret ?? null,
  };
}

export default function RepoSignupForm({
  existingRepos,
}: {
  existingRepos: ListeningRepository[];
}) {
  const [managedRepos, setManagedRepos] = useState<
    ManagedListeningRepository[]
  >((existingRepos ?? []).map(normalizeRepo));

  useEffect(() => {
    setManagedRepos((existingRepos ?? []).map(normalizeRepo));
  }, [existingRepos]);

  const handleRepoCreated = (repo: ManagedListeningRepository) => {
    setManagedRepos((prev) => [repo, ...prev]);
  };

  const handleRepoUpdated = (
    repoId: string,
    updates: Partial<ManagedListeningRepository>,
  ) => {
    setManagedRepos((prev) =>
      prev.map((repo) =>
        String(repo.id) === repoId ? { ...repo, ...updates } : repo,
      ),
    );
  };

  const handleRepoDeleted = (repoId: string) => {
    setManagedRepos((prev) =>
      prev.filter((repo) => String(repo.id) !== repoId),
    );
  };

  return (
    <div className="space-y-8">
      <CreateRepoForm onRepoCreated={handleRepoCreated} />

      <ExistingReposList
        repos={managedRepos}
        onRepoUpdated={handleRepoUpdated}
        onRepoDeleted={handleRepoDeleted}
      />
    </div>
  );
}
