"use client";

import { ExistingRepoCard } from "./ExistingRepoCard";
import { ManagedListeningRepository } from "./repoTypes";

export function ExistingReposList({
  repos,
  onRepoUpdated,
  onRepoDeleted,
}: {
  repos: ManagedListeningRepository[];
  onRepoUpdated: (
    repoId: string,
    updates: Partial<ManagedListeningRepository>,
  ) => void;
  onRepoDeleted: (repoId: string) => void;
}) {
  if (!repos.length) return null;

  return (
    <div className="pt-6 border-t border-secondary/10 space-y-4">
      <h3 className="text-sm font-bold text-text-main mb-3 font-mono">
        Manage registered repositories
      </h3>

      <div className="space-y-4">
        {repos.map((repo) => (
          <ExistingRepoCard
            key={repo.id}
            repo={repo}
            onRepoUpdated={onRepoUpdated}
            onRepoDeleted={onRepoDeleted}
          />
        ))}
      </div>
    </div>
  );
}
