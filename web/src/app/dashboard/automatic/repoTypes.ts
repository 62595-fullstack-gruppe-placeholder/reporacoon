import { z } from "zod";
import {
  createListeningRepositoryFormSchema,
  ListeningRepository,
} from "@/lib/repository/listeningRepository/listeningRepositorySchema";

export type RepoSignupData = z.infer<
  typeof createListeningRepositoryFormSchema
>;

export type BranchConfig = "DEFAULT" | "ALL";

export type ManagedListeningRepository = ListeningRepository & {
  is_active?: boolean;
  branch_config?: BranchConfig;
  webhook_secret?: string | null;
  repoKey?: string | null;
};

export type ExistingRepoEditorData = {
  branch_config: BranchConfig;
};
