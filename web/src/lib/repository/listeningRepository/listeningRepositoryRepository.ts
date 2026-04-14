import "server-only";
import { query, queryOne } from "@lib/database/remoteDataSource";
import {
  CreateListeningRepository,
  createListeningRepositorySchema,
  ListeningRepository,
  listeningRepositorySchema,
} from "./listeningRepositorySchema";

export async function createListeningRepository(
  input: CreateListeningRepository,
) {
  const data = createListeningRepositorySchema.parse(input);
  const row = await queryOne<ListeningRepository>(
    `
        INSERT INTO listening_repositories (owner_id, repo_url, encrypted_secret, branches, branch_config)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
            owner_id,
            repo_url,
            encrypted_secret,
            is_active,
            created_at,
            id,
            branches,
            branch_config
        `,
    [data.owner_id, data.repo_url, data.encrypted_secret, data.branches ?? [], data.branch_config ?? "DEFAULT"],
  );

  if (!row) {
    throw new Error("Failed to insert listening_repository");
  }

  return listeningRepositorySchema.parse(row);
}

export async function getUserListeningRepositories(userId: string) {
  const rows = await query<ListeningRepository>(
    `
        SELECT owner_id, repo_url, encrypted_secret, is_active, created_at, id, branches, branch_config
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
            branches,
            branch_config
        FROM listening_repositories
        WHERE repo_url = $1
        `,
    [repoUrl],
  );

  if (!row) return null;

  return listeningRepositorySchema.parse(row);
}
