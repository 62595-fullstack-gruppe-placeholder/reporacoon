"use server";

import { encrypt } from "@/lib/encryption";
import { getUser } from "@/lib/auth/userFromToken";
import { createListeningRepository } from "@/lib/repository/listeningRepository/listeningRepositoryRepository";
import {
  CreateListeningRepositoryForm,
  createListeningRepositoryFormSchema,
} from "@/lib/repository/listeningRepository/listeningRepositorySchema";

export async function newListeningRepo(form: CreateListeningRepositoryForm) {
  const formData = createListeningRepositoryFormSchema.parse(form);
  const user = await getUser();
  if (!user) {
    throw new Error("Authentication required");
  }

  try {
    const created = await createListeningRepository({
      owner_id: user.id,
      repo_url: formData.repoUrl,
      encrypted_secret: formData.webhookSecret ? encrypt(formData.webhookSecret) : null,
      branch_config: formData.branch_config,
      repoKey: formData.repoKey,
    });
    return {
      id: created.id,
      message: "Repository successfully registered for scanning!",
    };
  } catch (error: any) {
    if (error._isUniqueConstraintViolation) {
      return {
        message: "You already have a scan set up for this repository.",
      };
    }
    throw error;
  }
}
