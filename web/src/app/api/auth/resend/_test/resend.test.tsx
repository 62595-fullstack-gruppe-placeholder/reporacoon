import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/repository/user/userRepository", () => ({
  getUserByEmail: vi.fn(),
}));
vi.mock("@/lib/auth/email/emailConfirmationService", () => ({
  sendConfirmationEmail: vi.fn().mockResolvedValue({}),
  getLastEtherealURL: vi.fn().mockResolvedValue({}),
}));

import { POST } from "../route";
import { getUserByEmail } from "@/lib/repository/user/userRepository";
import { getLastEtherealURL, sendConfirmationEmail } from "@/lib/auth/email/emailConfirmationService";

const mockGetUserByEmail = vi.mocked(getUserByEmail);
const mockSendConfirmationEmail = vi.mocked(sendConfirmationEmail);
const mockGetLastEtherealURL = vi.mocked(getLastEtherealURL);

const makeRequest = (body: object) =>
  new NextRequest("http://localhost/api/auth/resend", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

const unconfirmedUser = {
  id: "user-1",
  email: "test@test.com",
  email_confirmed: false,
  password_hash: "hash",
  created_at: new Date().toISOString(),
};

beforeEach(() => vi.clearAllMocks());



describe("POST /api/auth/resend", () => {
  it("returns 400 if email is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Missing email" });
  });

  it("returns 200 silently if user does not exist", async () => {
    mockGetUserByEmail.mockResolvedValue(null);
    const res = await POST(makeRequest({ email: "unknown@test.com" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mockSendConfirmationEmail).not.toHaveBeenCalled();
  });

  it("returns 400 if email is already confirmed", async () => {
    mockGetUserByEmail.mockResolvedValue({ ...unconfirmedUser, email_confirmed: true });
    const res = await POST(makeRequest({ email: "test@test.com" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Already confirmed" });
    expect(mockSendConfirmationEmail).not.toHaveBeenCalled();
  });

  it("sends confirmation email for unconfirmed user", async () => {
    mockGetUserByEmail.mockResolvedValue(unconfirmedUser);
    const res = await POST(makeRequest({ email: "test@test.com" }));
    expect(res.status).toBe(200);
    expect(mockSendConfirmationEmail).toHaveBeenCalledWith("user-1", "test@test.com");
  });

  it("returns ok after sending email", async () => {
    mockGetUserByEmail.mockResolvedValue(unconfirmedUser);
    const res = await POST(makeRequest({ email: "test@test.com" }));
    expect(await res.json()).toEqual({ ok: true, confirmURL: {}, etherealURL: {} });
  });
});