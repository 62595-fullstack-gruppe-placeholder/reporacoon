import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAccessTokenCookie, setAccessTokenCookie } from "../cookies";

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock Next.js headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("Access Token Cookies", () => {
  const mockToken = "mock-jwt-token";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAccessTokenCookie", () => {
    it("reads from next/headers when no request is provided (Server Mode)", async () => {
      const mockGet = vi.fn().mockReturnValue({ name: "access-token", value: mockToken });
      vi.mocked(cookies).mockResolvedValue({ get: mockGet } as any);

      const result = await getAccessTokenCookie();

      expect(cookies).toHaveBeenCalled();
      expect(mockGet).toHaveBeenCalledWith("access-token");
      expect(result?.value).toBe(mockToken);
    });

    it("reads from the request object when provided (Middleware Mode)", async () => {
      // Create a mock NextRequest
      const mockReq = {
        cookies: {
          get: vi.fn().mockReturnValue({ name: "access-token", value: mockToken }),
        },
      } as unknown as NextRequest;

      const result = await getAccessTokenCookie(mockReq);

      expect(cookies).not.toHaveBeenCalled(); // Should NOT touch next/headers
      expect(mockReq.cookies.get).toHaveBeenCalledWith("access-token");
      expect(result?.value).toBe(mockToken);
    });
  });

  describe("setAccessTokenCookie", () => {
    it("sets cookie via next/headers when no response is provided", async () => {
      const mockSet = vi.fn();
      vi.mocked(cookies).mockResolvedValue({ set: mockSet } as any);

      await setAccessTokenCookie(mockToken);

      expect(cookies).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        "access-token",
        mockToken,
        expect.objectContaining({ httpOnly: true, path: "/" })
      );
    });

    it("sets cookie via the response object when provided", async () => {
      const mockRes = {
        cookies: {
          set: vi.fn(),
        },
      } as unknown as NextResponse;

      await setAccessTokenCookie(mockToken, mockRes);

      expect(cookies).not.toHaveBeenCalled(); // Should NOT touch next/headers
      expect(mockRes.cookies.set).toHaveBeenCalledWith(
        "access-token",
        mockToken,
        expect.objectContaining({ maxAge: 900 })
      );
    });
  });
});
