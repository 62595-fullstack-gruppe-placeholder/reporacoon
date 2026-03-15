// __tests__/deleteAccount.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteAccount } from "../deleteAccount";
import * as authModule from "@/lib/auth/userFromToken";
import * as userRepoModule from "@/lib/repository/user/userRepository";
import * as logoutModule from "@/app/_globalActions/logout";

vi.mock("@/lib/auth/userFromToken");
vi.mock("@/lib/repository/user/userRepository");
vi.mock("@/app/_globalActions/logout");
vi.mock("server-only", () => ({}));

describe("deleteAccount server action", () => {
  const mockUser = { id: "user123" };

  beforeEach(() => {
    vi.clearAllMocks();
    (authModule.getUser as any).mockResolvedValue(mockUser);
    (userRepoModule.deleteUser as any).mockResolvedValue(undefined);
    (logoutModule.logout as any).mockResolvedValue(undefined);
  });

  it("should succeed when user is authenticated", async () => {
    await deleteAccount();

    expect(authModule.getUser).toHaveBeenCalled();
    expect(userRepoModule.deleteUser).toHaveBeenCalledWith(mockUser.id);
    expect(logoutModule.logout).toHaveBeenCalled();
  });

  it("should throw error when user is not authenticated", async () => {
    (authModule.getUser as any).mockResolvedValue(null);

    await expect(deleteAccount()).rejects.toThrow("Authentication required");
    expect(userRepoModule.deleteUser).not.toHaveBeenCalled();
    expect(logoutModule.logout).not.toHaveBeenCalled();
  });

  it("should delete user and logout", async () => {
    await deleteAccount();

    expect(userRepoModule.deleteUser).toHaveBeenCalled();
    expect(logoutModule.logout).toHaveBeenCalled();
  });
});
