import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/lib/auth/email/emailConfirmationService", () => ({
  confirmEmail: vi.fn(),
}));

import { GET } from "../route";
import { confirmEmail } from "@/lib/auth/email/emailConfirmationService";

const mockConfirmEmail = vi.mocked(confirmEmail);

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
      expect(res.headers.get("location")).toContain("/error?reason=missing-token");
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
  });

  describe("valid token", () => {
    beforeEach(() => {
      mockConfirmEmail.mockResolvedValue({ success: true, user: fakeUser });
    });

    it("redirects to dashboard with force-token-refresh", async () => {
      const res = await GET(makeRequest("valid-token"));
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/dashboard?force-token-refresh=true");
    });
  });
});
