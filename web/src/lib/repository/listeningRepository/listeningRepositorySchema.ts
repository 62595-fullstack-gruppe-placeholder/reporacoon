import { z } from "zod";

export const branchConfigSchema = z.enum(["DEFAULT", "ALL"]);

export type ListeningRepositoryBranchConfig = z.infer<
  typeof branchConfigSchema
>;

export const listeningRepositorySchema = z.object({
  id: z.uuidv4(),
  created_at: z.coerce.date(),
  owner_id: z.uuidv4(),
  is_active: z.boolean(),
  repo_url: z.url(),
  encrypted_secret: z.string().nullable().optional(),
  branch_config: branchConfigSchema,
  repoKey: z.string().nullable().optional(),
});

export type ListeningRepository = z.infer<typeof listeningRepositorySchema>;

export const createListeningRepositorySchema = z.object({
  owner_id: z.uuidv4(),
  repo_url: z.url(),
  encrypted_secret: z.string().nullable().optional(),
  branch_config: branchConfigSchema.nullable().optional(),
  repoKey: z.string().nullable().optional(),
});

export type CreateListeningRepository = z.infer<
  typeof createListeningRepositorySchema
>;

export const createListeningRepositoryFormSchema = z.object({
  repoUrl: z
    .url("Enter a valid repository URL")
    .min(1, "Repository URL is required"),
  webhookSecret: z.string().nullable().optional(),
  branch_config: branchConfigSchema.nullable().optional(),
  repoType: z.string().nullable().optional(),
  repoKey: z.string().nullable().optional(),
});

export type CreateListeningRepositoryForm = z.infer<
  typeof createListeningRepositoryFormSchema
>;

export const updateBranchConfigDTOSchema = z.object({
  id: z.string(),
  branch_config: branchConfigSchema,
});

export type UpdateBranchConfigDTO = z.infer<typeof updateBranchConfigDTOSchema>;

export const deactivateRepoDTOSchema = z.object({
  id: z.string(),
});

export type DeactivateRepoDTO = z.infer<typeof deactivateRepoDTOSchema>;

export const deleteRepoDTOSchema = z.object({
  id: z.string(),
});

export type DeleteRepoDTO = z.infer<typeof deleteRepoDTOSchema>;
