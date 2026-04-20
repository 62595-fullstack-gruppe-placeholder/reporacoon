import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@lib/database/remoteDataSource", () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
}));

import { query, queryOne } from "@lib/database/remoteDataSource";
import * as userRepo from "./userRepository";

const mockQueryOne = vi.mocked(queryOne);
const mockQuery = vi.mocked(query);

const baseUser = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "test@example.com",
  email_confirmed: true,
  tier: "free",
  is_admin: false,
  settings: { extensions: [".ts"], isDeep: false },
};

const baseSettings = {
  extensions: [".js", ".ts"],
  isDeep: true,
};

describe("userRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("getUserById returns parsed user when row exists", async () => {
    mockQueryOne.mockResolvedValueOnce(baseUser as any);

    const result = await userRepo.getUserById("abc123");

    expect(mockQueryOne).toHaveBeenCalledWith(
      expect.stringContaining("SELECT id, email, email_confirmed, tier, is_admin"),
      ["abc123"],
    );
    expect(result).toEqual(baseUser);
  });

  test("getUserById returns null when no row is found", async () => {
    mockQueryOne.mockResolvedValueOnce(null);

    const result = await userRepo.getUserById("abc123");

    expect(result).toBeNull();
  });

  test("getUserSettingsById returns parsed settings when row exists", async () => {
    mockQueryOne.mockResolvedValueOnce({ user_settings: baseSettings });

    const result = await userRepo.getUserSettingsById("abc123");

    expect(mockQueryOne).toHaveBeenCalledWith(
      expect.stringContaining("SELECT user_settings FROM users WHERE id = $1"),
      ["abc123"],
    );
    expect(result).toEqual(baseSettings);
  });

  test("getUserSettingsById returns null when no row exists", async () => {
    mockQueryOne.mockResolvedValueOnce(null);

    const result = await userRepo.getUserSettingsById("abc123");

    expect(result).toBeNull();
  });

  test("setUserSettingsById updates settings", async () => {
    mockQueryOne.mockResolvedValueOnce(null);

    await userRepo.setUserSettingsById(baseSettings, "abc123");

    expect(mockQueryOne).toHaveBeenCalledWith(
      "UPDATE users SET user_settings = $1 WHERE id = $2",
      [baseSettings, "abc123"],
    );
  });

  test("createUser inserts row and returns created user", async () => {
    mockQueryOne.mockResolvedValueOnce(baseUser as any);

    const result = await userRepo.createUser({
      email: "test@example.com",
      password: "password123",
    });

    expect(mockQueryOne).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO users"),
      ["test@example.com", "password123"],
    );
    expect(result).toEqual(baseUser);
  });

  test("createUser throws friendly error when email already exists", async () => {
    const error = new Error("duplicate key") as any;
    error.code = "23505";
    mockQueryOne.mockRejectedValueOnce(error);

    await expect(
      userRepo.createUser({
        email: "test@example.com",
        password: "password123",
      }),
    ).rejects.toThrow("A user with this email already exists.");
  });

  test("getAllUsers returns parsed users", async () => {
    mockQuery.mockResolvedValueOnce([baseUser] as any);

    const result = await userRepo.getAllUsers();

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("SELECT id, email, email_confirmed, tier, is_admin"),
    );
    expect(result).toEqual([baseUser]);
  });

  test("verifyUserCredentials returns user when credentials are valid", async () => {
    mockQueryOne.mockResolvedValueOnce(baseUser as any);

    const result = await userRepo.verifyUserCredentials({
      email: "test@example.com",
      password: "password123",
    });

    expect(mockQueryOne).toHaveBeenCalledWith(
      expect.stringContaining("SELECT id, email, email_confirmed, tier, is_admin FROM users"),
      ["test@example.com", "password123"],
    );
    expect(result).toEqual(baseUser);
  });

  test("verifyUserCredentials returns null when row is invalid", async () => {
    mockQueryOne.mockResolvedValueOnce({ email: "invalid@example.com" } as any);

    const result = await userRepo.verifyUserCredentials({
      email: "invalid@example.com",
      password: "password123",
    });

    expect(result).toBeNull();
  });

  test("markUserEmailConfirmed updates the user record", async () => {
    mockQueryOne.mockResolvedValueOnce(null);

    await userRepo.markUserEmailConfirmed("abc123");

    expect(mockQueryOne).toHaveBeenCalledWith(
      "UPDATE users SET email_confirmed = true WHERE id = $1",
      ["abc123"],
    );
  });

  test("getUserByEmail returns the user row", async () => {
    mockQueryOne.mockResolvedValueOnce(baseUser as any);

    const result = await userRepo.getUserByEmail("test@example.com");

    expect(mockQueryOne).toHaveBeenCalledWith(
      "SELECT * FROM users WHERE email = $1",
      ["test@example.com"],
    );
    expect(result).toEqual(baseUser);
  });

  test("changeUserPassword updates the password", async () => {
    mockQueryOne.mockResolvedValueOnce(null);

    await userRepo.changeUserPassword({
      userId: "abc123",
      currentPassword: "oldpass",
      newPassword: "newpass123",
    });

    expect(mockQueryOne).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE users SET password_hash = crypt($3, gen_salt('bf'))"),
      ["abc123", "oldpass", "newpass123"],
    );
  });

  test("deleteUser removes the user", async () => {
    mockQueryOne.mockResolvedValueOnce(null);

    await userRepo.deleteUser("abc123");

    expect(mockQueryOne).toHaveBeenCalledWith(
      "DELETE FROM users WHERE id = $1",
      ["abc123"],
    );
  });

  test("setUserTier returns true when user is updated", async () => {
    mockQueryOne.mockResolvedValueOnce({ id: "abc123" });

    const result = await userRepo.setUserTier("abc123", "pro");

    expect(mockQueryOne).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE users SET tier = $1 WHERE id = $2 RETURNING id"),
      ["pro", "abc123"],
    );
    expect(result).toBe(true);
  });

  test("setUserTier returns false when no user is updated", async () => {
    mockQueryOne.mockResolvedValueOnce(null);

    const result = await userRepo.setUserTier("abc123", "pro");

    expect(result).toBe(false);
  });

  test("setUserAdmin returns true when user is updated", async () => {
    mockQueryOne.mockResolvedValueOnce({ id: "abc123" });

    const result = await userRepo.setUserAdmin("abc123", true);

    expect(mockQueryOne).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE users SET is_admin = $1 WHERE id = $2 RETURNING id"),
      [true, "abc123"],
    );
    expect(result).toBe(true);
  });

  test("setUserAdmin returns false when no user is updated", async () => {
    mockQueryOne.mockResolvedValueOnce(null);

    const result = await userRepo.setUserAdmin("abc123", false);

    expect(result).toBe(false);
  });
});
