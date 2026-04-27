import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@lib/database/remoteDataSource", () => ({
  queryOne: vi.fn(),
}));

import { queryOne } from "@lib/database/remoteDataSource";
import * as refreshTokenRepo from "./refreshTokenRepository";

const mockQueryOne = vi.mocked(queryOne);

const now = new Date("2026-04-20T00:00:00.000Z");
const refreshTokenRow = {
  id: "refreshtoken-123",
  user_id: "user-123",
  token_hash: "hashed-token",
  expires_at: now,
  revoked_at: null,
  created_at: now,
};

describe("refreshTokenRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("getRefreshTokenById returns the parsed refresh token when found", async () => {
    mockQueryOne.mockResolvedValueOnce(refreshTokenRow as any);

    const result = await refreshTokenRepo.getRefreshTokenById("refreshtoken-123");

    expect(mockQueryOne).toHaveBeenCalledWith(
      expect.stringContaining("SELECT id, user_id, token_hash, expires_at, revoked_at, created_at"),
      ["refreshtoken-123"],
    );
    expect(result).toEqual(refreshTokenRow);
  });

  test("getRefreshTokenById returns null when no row exists", async () => {
    mockQueryOne.mockResolvedValueOnce(null);

    const result = await refreshTokenRepo.getRefreshTokenById("missing-id");

    expect(result).toBeNull();
  });

  test("createRefreshToken inserts a refresh token and returns the created row", async () => {
    mockQueryOne.mockResolvedValueOnce(refreshTokenRow as any);

    const result = await refreshTokenRepo.createRefreshToken({
      user_id: "user-123",
      token_hash: "hashed-token",
      expires_at: now,
    });

    expect(mockQueryOne).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO refresh_tokens"),
      ["user-123", "hashed-token", now],
      undefined,
    );
    expect(result).toEqual(refreshTokenRow);
  });

  test("createRefreshToken forwards the client when provided", async () => {
    const mockClient = { query: vi.fn() } as any;
    mockQueryOne.mockResolvedValueOnce(refreshTokenRow as any);

    const result = await refreshTokenRepo.createRefreshToken(
      {
        user_id: "user-123",
        token_hash: "hashed-token",
        expires_at: now,
      },
      mockClient,
    );

    expect(mockQueryOne).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO refresh_tokens"),
      ["user-123", "hashed-token", now],
      mockClient,
    );
    expect(result).toEqual(refreshTokenRow);
  });

  test("revokeUserRefreshTokens updates tokens for the given user", async () => {
    mockQueryOne.mockResolvedValueOnce(null);

    await refreshTokenRepo.revokeUserRefreshTokens("user-123");

    expect(mockQueryOne).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL"),
      ["user-123"],
      undefined,
    );
  });

  test("revokeUserRefreshTokens forwards the client when provided", async () => {
    const mockClient = { query: vi.fn() } as any;
    mockQueryOne.mockResolvedValueOnce(null);

    await refreshTokenRepo.revokeUserRefreshTokens("user-123", mockClient);

    expect(mockQueryOne).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL"),
      ["user-123"],
      mockClient,
    );
  });

  test("getRefreshTokenByHash returns the parsed refresh token when found", async () => {
    mockQueryOne.mockResolvedValueOnce(refreshTokenRow as any);

    const result = await refreshTokenRepo.getRefreshTokenByHash("hashed-token");

    expect(mockQueryOne).toHaveBeenCalledWith(
      expect.stringContaining("SELECT id, user_id, token_hash, expires_at, revoked_at, created_at"),
      ["hashed-token"],
    );
    expect(result).toEqual(refreshTokenRow);
  });

  test("getRefreshTokenByHash returns null when no row exists", async () => {
    mockQueryOne.mockResolvedValueOnce(null);

    const result = await refreshTokenRepo.getRefreshTokenByHash("missing-hash");

    expect(result).toBeNull();
  });
});
