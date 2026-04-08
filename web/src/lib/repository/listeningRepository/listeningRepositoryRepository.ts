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
        INSERT INTO listening_repositories (owner_id, repo_url, secret_hash)
        VALUES ($1, $2, $3)
        RETURNING
            owner_id,
            repo_url,
            secret_hash,
            is_active,
            created_at,
            id
        `,
    [data.owner_id, data.repo_url, data.secret_hash],
  );

  if (!row) {
    throw new Error("Failed to insert listening_repository");
  }

  return listeningRepositorySchema.parse(row);
}

export async function getUserListeningRepositories(userId: string) {
  const rows = await query<ListeningRepository>(
    `
        SELECT owner_id, repo_url, secret_hash, is_active, created_at, id
        FROM listening_repositories
        WHERE owner_id = $1
        `,
    [userId],
  );
  return rows.map((row) => listeningRepositorySchema.parse(row));
}
