import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/lib/auth/email/emailConfirmationService", () => ({
  confirmEmail: vi.fn(),
}));
vi.mock("@/lib/auth/accessToken", () => ({
  generateAccessToken: vi.fn().mockResolvedValue("mock-access-token"),
}));

import { GET } from "../route";
import { confirmEmail } from "@/lib/auth/email/emailConfirmationService";
import { generateAccessToken } from "@/lib/auth/accessToken";

const mockConfirmEmail = vi.mocked(confirmEmail);
const mockGenerateAccessToken = vi.mocked(generateAccessToken);

const fakeUser = {
  id: "user-1",
  email: "test@test.com",
  email_confirmed: true,
  password_hash: "hash",
  created_at: new Date().toISOString(),
};

const makeRequest = (token?: string, acceptJson = false) => {
  const url = token
    ? `http://localhost/api/auth/confirm?token=${token}`
    : `http://localhost/api/auth/confirm`;
  return new NextRequest(url, {
    headers: acceptJson ? { accept: "application/json" } : {},
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost";
});

describe("GET /api/auth/confirm", () => {
  describe("missing token", () => {
    it("redirects to error page when token is missing", async () => {
      const res = await GET(makeRequest());
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/confirm-email/error?reason=missing-token");
    });

    it("returns JSON error when accept is application/json", async () => {
      const res = await GET(makeRequest(undefined, true));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ success: false, error: "Missing token" });
    });
  });

  describe("invalid/expired token", () => {
    it("redirects to error page on invalid token", async () => {
      mockConfirmEmail.mockResolvedValue({ success: false, error: "Invalid token" });
      const res = await GET(makeRequest("bad-token"));
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("Invalid%20token");
    });

    it("redirects to error page on expired token", async () => {
      mockConfirmEmail.mockResolvedValue({ success: false, error: "Token expired" });
      const res = await GET(makeRequest("expired-token"));
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("Token%20expired");
    });

    it("returns JSON error on invalid token when accept is application/json", async () => {
      mockConfirmEmail.mockResolvedValue({ success: false, error: "Invalid token" });
      const res = await GET(makeRequest("bad-token", true));
      expect(await res.json()).toEqual({ success: false, error: "Invalid token" });
    });
  });

  describe("valid token", () => {
    beforeEach(() => {
      mockConfirmEmail.mockResolvedValue({ success: true, user: fakeUser });
    });

    it("redirects to /confirm-email/confirmed", async () => {
      const res = await GET(makeRequest("valid-token"));
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/confirm-email/confirmed");
    });

    it("sets access-token cookie on redirect", async () => {
      const res = await GET(makeRequest("valid-token"));
      const cookie = res.headers.get("set-cookie");
      expect(cookie).toContain("access-token=mock-access-token");
    });

    it("sets httpOnly cookie", async () => {
      const res = await GET(makeRequest("valid-token"));
      expect(res.headers.get("set-cookie")).toContain("HttpOnly");
    });

    it("generates access token for the confirmed user", async () => {
      await GET(makeRequest("valid-token"));
      expect(mockGenerateAccessToken).toHaveBeenCalledWith(fakeUser);
    });

    it("returns JSON success with cookie when accept is application/json", async () => {
      const res = await GET(makeRequest("valid-token", true));
      expect(await res.json()).toEqual({ success: true });
      expect(res.headers.get("set-cookie")).toContain("access-token=mock-access-token");
    });
  });
});