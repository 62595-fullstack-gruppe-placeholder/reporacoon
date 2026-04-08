"use server";

import { getUser } from "@/lib/auth/userFromToken";
import { createListeningRepository } from "@/lib/repository/listeningRepository/listeningRepositoryRepository";
import {
  CreateListeningRepositoryForm,
  createListeningRepositoryFormSchema,
} from "@/lib/repository/listeningRepository/listeningRepositorySchema";
import { createHash } from "crypto";

export async function newListeningRepo(form: CreateListeningRepositoryForm) {
  const formData = createListeningRepositoryFormSchema.parse(form);
  const user = await getUser();
  if (!user) {
    throw new Error("Authentication required");
  }

  const hash = formData.webhookSecret
    ? createHash("sha256").update(formData.webhookSecret).digest("hex")
    : null;

  try {
    const created = await createListeningRepository({
      owner_id: user.id,
      repo_url: formData.repoUrl,
      secret_hash: hash,
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
