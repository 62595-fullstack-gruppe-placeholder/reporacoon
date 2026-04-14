import { z } from "zod";

export const branchConfigSchema = z.enum(["DEFAULT", "CUSTOM"]);

export type ListeningRepositoryBranchConfig = z.infer<typeof branchConfigSchema>

export const listeningRepositorySchema = z.object({
  id: z.uuidv4(),
  created_at: z.coerce.date(),
  owner_id: z.uuidv4(),
  is_active: z.boolean(),
  repo_url: z.url(),
  secret_hash: z.string().nullable().optional(),
  branches: z.array(z.string()),
  branch_config: branchConfigSchema,
});

export type ListeningRepository = z.infer<typeof listeningRepositorySchema>;

export const createListeningRepositorySchema = z.object({
  owner_id: z.uuidv4(),
  repo_url: z.url(),
  secret_hash: z.string().nullable().optional(),
  branches: z.array(z.string()).optional(),
  branch_config: branchConfigSchema.nullable().optional(),
});

export type CreateListeningRepository = z.infer<
  typeof createListeningRepositorySchema
>;

export const createListeningRepositoryFormSchema = z.object({
  repoUrl: z
    .url("Enter a valid repository URL")
    .min(1, "Repository URL is required"),
  webhookSecret: z.string().nullable().optional(),
});

export type CreateListeningRepositoryForm = z.infer<
  typeof createListeningRepositoryFormSchema
>;
