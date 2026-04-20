// @vitest-environment node

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock Next.js headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("Access Token Cookies", () => {
  const mockToken = "mock-jwt-token";
  const mockRefreshToken = "mock-refresh-token";

  let cookies: any;
  let getAccessTokenCookie: any;
  let setAccessTokenCookie: any;
  let setRefreshTokenCookie: any;
  let deleteAuthCookies: any;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();

    // Dynamic import to reset module state
    const headersModule = await import("next/headers");
    cookies = headersModule.cookies;
    const cookiesModule = await import("../cookies");
    getAccessTokenCookie = cookiesModule.getAccessTokenCookie;
    setAccessTokenCookie = cookiesModule.setAccessTokenCookie;
    setRefreshTokenCookie = cookiesModule.setRefreshTokenCookie;
    deleteAuthCookies = cookiesModule.deleteAuthCookies;
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

    it("returns undefined when cookie does not exist (Server Mode)", async () => {
      const mockGet = vi.fn().mockReturnValue(undefined);
      vi.mocked(cookies).mockResolvedValue({ get: mockGet } as any);

      const result = await getAccessTokenCookie();

      expect(mockGet).toHaveBeenCalledWith("access-token");
      expect(result).toBeUndefined();
    });

    it("returns undefined when cookie does not exist (Middleware Mode)", async () => {
      const mockReq = {
        cookies: {
          get: vi.fn().mockReturnValue(undefined),
        },
      } as unknown as NextRequest;

      const result = await getAccessTokenCookie(mockReq);

      expect(mockReq.cookies.get).toHaveBeenCalledWith("access-token");
      expect(result).toBeUndefined();
    });
  });

  describe("setAccessTokenCookie", () => {
    it("sets cookie via next/headers when no response is provided (development)", async () => {
      process.env.NODE_ENV = "development";
      const mockSet = vi.fn();
      vi.mocked(cookies).mockResolvedValue({ set: mockSet } as any);

      await setAccessTokenCookie(mockToken);

      expect(cookies).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        "access-token",
        mockToken,
        {
          httpOnly: true,
          secure: false, // development
          sameSite: "lax",
          path: "/",
          maxAge: 15 * 60,
        }
      );
    });

    it("sets cookie via next/headers when no response is provided (production)", async () => {
      vi.stubEnv("NODE_ENV", "production");
      const mockSet = vi.fn();
      vi.mocked(cookies).mockResolvedValue({ set: mockSet } as any);

      await setAccessTokenCookie(mockToken);

      expect(cookies).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        "access-token",
        mockToken,
        {
          httpOnly: true,
          secure: true, // production
          sameSite: "lax",
          path: "/",
          maxAge: 15 * 60,
        }
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
        {
          httpOnly: true,
          secure: false, // default development
          sameSite: "lax",
          path: "/",
          maxAge: 15 * 60,
        }
      );
    });
  });

  describe("setRefreshTokenCookie", () => {
    it("sets refresh token cookie via next/headers (development)", async () => {
      process.env.NODE_ENV = "development";
      const mockSet = vi.fn();
      vi.mocked(cookies).mockResolvedValue({ set: mockSet } as any);

      await setRefreshTokenCookie(mockRefreshToken);

      expect(cookies).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        "refresh-token",
        mockRefreshToken,
        {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30 days
        }
      );
    });

    it("sets refresh token cookie via next/headers (production)", async () => {
      vi.stubEnv("NODE_ENV", "production");
      const mockSet = vi.fn();
      vi.mocked(cookies).mockResolvedValue({ set: mockSet } as any);

      await setRefreshTokenCookie(mockRefreshToken);

      expect(cookies).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        "refresh-token",
        mockRefreshToken,
        {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        }
      );
    });

    it("sets refresh token cookie via response object", async () => {
      const mockRes = {
        cookies: {
          set: vi.fn(),
        },
      } as unknown as NextResponse;

      await setRefreshTokenCookie(mockRefreshToken, mockRes);

      expect(cookies).not.toHaveBeenCalled();
      expect(mockRes.cookies.set).toHaveBeenCalledWith(
        "refresh-token",
        mockRefreshToken,
        {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        }
      );
    });
  });

  describe("deleteAuthCookies", () => {
    it("deletes both access and refresh tokens via next/headers", async () => {
      const mockDelete = vi.fn();
      vi.mocked(cookies).mockResolvedValue({ delete: mockDelete } as any);

      await deleteAuthCookies();

      expect(cookies).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalledWith("access-token");
      expect(mockDelete).toHaveBeenCalledWith("refresh-token");
      expect(mockDelete).toHaveBeenCalledTimes(2);
    });

    it("deletes both access and refresh tokens via response object", async () => {
      const mockRes = {
        cookies: {
          delete: vi.fn(),
        },
      } as unknown as NextResponse;

      await deleteAuthCookies(mockRes);

      expect(cookies).not.toHaveBeenCalled();
      expect(mockRes.cookies.delete).toHaveBeenCalledWith("access-token");
      expect(mockRes.cookies.delete).toHaveBeenCalledWith("refresh-token");
      expect(mockRes.cookies.delete).toHaveBeenCalledTimes(2);
    });
  });
});
