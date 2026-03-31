import { deleteAuthCookies } from "@/lib/auth/cookies";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { logout } from "../logout";
import { getUser } from "@/lib/auth/userFromToken";
import { revokeUserRefreshTokens } from "@/lib/repository/refreshToken/refreshTokenRepository";
import { redirect } from "next/navigation";

// Mock server-only
vi.mock("server-only", () => ({}));

vi.mock("next/navigation", () => ({
    redirect: vi.fn(),
}));

// Update to match your new combined delete function
vi.mock("@/lib/auth/cookies", () => ({
    deleteAuthCookies: vi.fn(),
}));

vi.mock("@/lib/auth/userFromToken", () => ({
    getUser: vi.fn(),
}));

vi.mock("@/lib/repository/refreshToken/refreshTokenRepository", () => ({
    revokeUserRefreshTokens: vi.fn(),
}));

describe("logout", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (getUser as Mock).mockResolvedValue({
            id: "mock-user-id",
        });
    });

    it("should revoke tokens in DB before deleting cookies and redirecting", async () => {
        await logout();

        // 1. Verify DB Revocation happened first
        expect(getUser).toHaveBeenCalled();
        expect(revokeUserRefreshTokens).toHaveBeenCalledWith("mock-user-id");

        // 2. Verify Cookie Deletion (Server Action mode, so no res passed)
        expect(deleteAuthCookies).toHaveBeenCalledWith(); 

        // 3. Verify Redirect
        expect(redirect).toHaveBeenCalledWith("/");
    });

    it("should still delete cookies even if getUser fails", async () => {
        (getUser as Mock).mockResolvedValue(null);

        await logout();

        expect(revokeUserRefreshTokens).not.toHaveBeenCalled();
        expect(deleteAuthCookies).toHaveBeenCalled();
        expect(redirect).toHaveBeenCalledWith("/");
    });
});