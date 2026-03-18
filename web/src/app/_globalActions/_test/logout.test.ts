import { deleteAccessTokenCookie, deleteRefreshTokenCookie } from "@/lib/auth/cookies";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { logout } from "../logout";
import { getUser } from "@/lib/auth/userFromToken";
import { revokeUserRefreshTokens } from "@/lib/repository/refreshToken/refreshTokenRepository";

// Mock server-only so Vitest can import the module in jsdom
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
    redirect: vi.fn(),
}))
vi.mock("@/lib/auth/cookies", () => ({
    deleteAccessTokenCookie: vi.fn(),
    deleteRefreshTokenCookie: vi.fn(),
}))
vi.mock("@/lib/auth/userFromToken", () => ({
    getUser: vi.fn(),
}))
vi.mock("@/lib/repository/refreshToken/refreshTokenRepository", () => ({
    revokeUserRefreshTokens: vi.fn(),
}))

describe("logout", () => {

    beforeEach(() => {
        ;(getUser as Mock).mockResolvedValueOnce({
            id: "mock-user-id",
        })
    })

  it("should delete auth cookies and revoke refresh tokens and redirect", async () => {
      await logout();

      expect(deleteAccessTokenCookie).toHaveBeenCalled();
      expect(deleteRefreshTokenCookie).toHaveBeenCalled();
      expect(getUser).toHaveBeenCalled();
      expect(revokeUserRefreshTokens).toHaveBeenCalledWith("mock-user-id");
      expect(revokeUserRefreshTokens).toHaveBeenCalledBefore(deleteAccessTokenCookie as Mock)
  })
});
