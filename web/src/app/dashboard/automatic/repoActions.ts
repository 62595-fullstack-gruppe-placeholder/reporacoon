"use server";

import {
  DeactivateRepoDTO,
  deactivateRepoDTOSchema,
  DeleteRepoDTO,
  deleteRepoDTOSchema,
  UpdateBranchConfigDTO,
  updateBranchConfigDTOSchema,
} from "@/lib/repository/listeningRepository/listeningRepositorySchema";
import {
  deactivateRepo,
  deleteRepo,
  reactivateRepo,
  updateBranchConfig,
} from "@/lib/repository/listeningRepository/listeningRepositoryRepository";

export async function updateListeningRepo(dto: UpdateBranchConfigDTO) {
  const validatedDTO = updateBranchConfigDTOSchema.parse(dto);
  await updateBranchConfig(validatedDTO);

  return {
    success: true,
    message: "Repository settings updated.",
    repo: {
      id: validatedDTO.id,
      branch_config: validatedDTO.branch_config,
    },
  };
}

export async function deactivateListeningRepo(dto: DeactivateRepoDTO) {
  const validatedDTO = deactivateRepoDTOSchema.parse(dto);
  await deactivateRepo(validatedDTO);

  return {
    success: true,
    message: "Repository deactivated.",
    repo: {
      id: validatedDTO.id,
      is_active: false,
    },
  };
}

export async function reactivateListeningRepo(dto: DeactivateRepoDTO) {
  const validatedDTO = deactivateRepoDTOSchema.parse(dto);
  await reactivateRepo(validatedDTO);

  return {
    success: true,
    message: "Repository re-activated.",
    repo: {
      id: validatedDTO.id,
      is_active: true,
    },
  };
}

export async function deleteListeningRepo(dto: DeleteRepoDTO) {
  const validatedDTO = deleteRepoDTOSchema.parse(dto);
  await deleteRepo(validatedDTO);

  return {
    success: true,
    message: "Repository deleted.",
    deletedId: validatedDTO.id,
  };
}
