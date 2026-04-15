import { z } from "zod";
import {
  createListeningRepositoryFormSchema,
  ListeningRepository,
} from "@/lib/repository/listeningRepository/listeningRepositorySchema";

export type RepoSignupData = z.infer<
  typeof createListeningRepositoryFormSchema
>;

export type BranchConfig = "DEFAULT" | "ALL" | "CUSTOM";

export type ManagedListeningRepository = ListeningRepository & {
  is_active?: boolean;
  branch_config?: BranchConfig;
  branches?: string[];
  webhook_secret?: string | null;
};

export type ExistingRepoEditorData = {
  branch_config: BranchConfig;
  branches: string[];
};
