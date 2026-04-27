import "server-only";
import { query, queryOne } from "@lib/database/remoteDataSource";
import {
  CreateListeningRepository,
  createListeningRepositorySchema,
  DeactivateRepoDTO,
  DeleteRepoDTO,
  ListeningRepository,
  listeningRepositorySchema,
  UpdateBranchConfigDTO,
} from "./listeningRepositorySchema";

export async function createListeningRepository(
  input: CreateListeningRepository,
) {
  const data = createListeningRepositorySchema.parse(input);
  const row = await queryOne<ListeningRepository>(
    `
        INSERT INTO listening_repositories (owner_id, repo_url, encrypted_secret, branch_config, repoKey)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
            owner_id,
            repo_url,
            encrypted_secret,
            is_active,
            created_at,
            id,
            branch_config,
            repoKey
        `,
    [
      data.owner_id,
      data.repo_url,
      data.encrypted_secret,
      data.branch_config ?? "DEFAULT",
      data.repoKey ?? null,
    ],
  );

  if (!row) {
    throw new Error("Failed to insert listening_repository");
  }

  return listeningRepositorySchema.parse(row);
}

export async function getUserListeningRepositories(userId: string) {
  const rows = await query<ListeningRepository>(
    `
        SELECT owner_id, repo_url, encrypted_secret, is_active, created_at, id, branch_config, repoKey
        FROM listening_repositories
        WHERE owner_id = $1
        `,
    [userId],
  );
  return rows.map((row) => listeningRepositorySchema.parse(row));
}

export async function getListeningRepositoryByUrl(repoUrl: string) {
  const row = await queryOne<ListeningRepository>(
    `
        SELECT
            owner_id,
            repo_url,
            encrypted_secret,
            is_active,
            created_at,
            id,
            branch_config,
            repoKey,
        FROM listening_repositories
        WHERE repo_url = $1
        `,
    [repoUrl],
  );

  if (!row) return null;

  return listeningRepositorySchema.parse(row);
}

export async function updateBranchConfig(dto: UpdateBranchConfigDTO) {
  await queryOne<UpdateBranchConfigDTO>(
    `
      UPDATE listening_repositories SET
        branch_config = $1
      WHERE id = $2 and is_active = true
    `,
    [dto.branch_config, dto.id],
  );
}

export async function deactivateRepo(dto: DeactivateRepoDTO) {
  await queryOne<DeactivateRepoDTO>(
    `
    UPDATE listening_repositories SET
      is_active = false
    WHERE id = $1 AND is_active = true
    `,
    [dto.id],
  );
}

export async function reactivateRepo(dto: DeactivateRepoDTO) {
  await queryOne<DeactivateRepoDTO>(
    `
    UPDATE listening_repositories SET
      is_active = true
    WHERE id = $1 AND is_active = false
    `,
    [dto.id],
  );
}

export async function deleteRepo(dto: DeleteRepoDTO) {
  await queryOne<DeleteRepoDTO>(
    `
    DELETE FROM listening_repositories WHERE
      id = $1 AND is_active = false
    `,
    [dto.id],
  );
}
