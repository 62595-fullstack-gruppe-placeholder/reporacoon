import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendEmail } from "../mailer";


import { sendConfirmationEmail, confirmEmail } from "../emailConfirmationService";
import {
  createEmailConfirmation,
  getEmailConfirmationByTokenHash,
  markEmailConfirmationUsed,
} from "@/lib/repository/emailConfirmations/emailConfirmationRepository";
import { getUserById, markUserEmailConfirmed } from "@/lib/repository/user/userRepository";




vi.mock("server-only", () => ({}));
vi.mock("../mailer", () => ({ sendEmail: vi.fn().mockResolvedValue({}) }));
vi.mock("@/lib/repository/emailConfirmations/emailConfirmationRepository", () => ({
  createEmailConfirmation: vi.fn().mockResolvedValue({}),
  getEmailConfirmationByTokenHash: vi.fn(),
  markEmailConfirmationUsed: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/lib/repository/user/userRepository", () => ({
  getUserById: vi.fn(),
  markUserEmailConfirmed: vi.fn().mockResolvedValue({}),
}));


const mockSendEmail = vi.mocked(sendEmail);
const mockCreate = vi.mocked(createEmailConfirmation);
const mockGetByHash = vi.mocked(getEmailConfirmationByTokenHash);
const mockMarkUsed = vi.mocked(markEmailConfirmationUsed);
const mockGetUser = vi.mocked(getUserById);
const mockMarkConfirmed = vi.mocked(markUserEmailConfirmed);

const validConfirmation = () => ({
  id: "conf-1",
  user_id: "user-1",
  token_hash: "hash",
  confirmed_at: null,
  expires_at: new Date(Date.now() + 10_000).toISOString(),
});

const fakeUser = {
  id: "user-1",
  email: "test@test.com",
  email_confirmed: true,
  password_hash: "hash",
  created_at: new Date().toISOString(),
};

beforeEach(() => vi.clearAllMocks());

describe("sendConfirmationEmail", () => {
  it("stores confirmation with correct user_id", async () => {
    await sendConfirmationEmail("user-1", "test@test.com");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-1" })
    );
  });

  it("sends email to correct address", async () => {
    await sendConfirmationEmail("user-1", "test@test.com");
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "test@test.com" })
    );
  });

  it("email contains confirmation URL with token", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost";
    await sendConfirmationEmail("user-1", "test@test.com");
    const { html } = mockSendEmail.mock.calls[0][0];
    expect(html).toContain("/api/auth/confirm?token=");
  });

  it("stores hashed token, not raw token", async () => {
    await sendConfirmationEmail("user-1", "test@test.com");
    const { token_hash } = mockCreate.mock.calls[0][0];
    const { html } = mockSendEmail.mock.calls[0][0];
    // raw token is in the email, hash should NOT be
    expect(html).not.toContain(token_hash);
  });

  it("sets expiry ~24 hours from now", async () => {
    const before = Date.now();
    await sendConfirmationEmail("user-1", "test@test.com");
    const { expires_at } = mockCreate.mock.calls[0][0];
    const expiry = new Date(expires_at).getTime();
    expect(expiry).toBeGreaterThan(before + 23 * 60 * 60 * 1000);
    expect(expiry).toBeLessThan(before + 25 * 60 * 60 * 1000);
  });

  it("generates unique tokens on each call", async () => {
    await sendConfirmationEmail("user-1", "test@test.com");
    await sendConfirmationEmail("user-1", "test@test.com");
    const hash1 = mockCreate.mock.calls[0][0].token_hash;
    const hash2 = mockCreate.mock.calls[1][0].token_hash;
    expect(hash1).not.toBe(hash2);
  });
});

describe("confirmEmail", () => {
  it("returns error for invalid token", async () => {
    mockGetByHash.mockResolvedValue(null);
    expect(await confirmEmail("bad")).toEqual({ success: false, error: "Invalid token" });
  });

  it("returns error for already used token", async () => {
    mockGetByHash.mockResolvedValue({
      ...validConfirmation(),
      confirmed_at: new Date().toISOString(),
    });
    expect(await confirmEmail("used")).toEqual({ success: false, error: "Token already used" });
  });

  it("returns error for expired token", async () => {
    mockGetByHash.mockResolvedValue({
      ...validConfirmation(),
      expires_at: new Date(Date.now() - 1000).toISOString(),
    });
    expect(await confirmEmail("expired")).toEqual({ success: false, error: "Token expired" });
  });

  it("returns error if user not found", async () => {
    mockGetByHash.mockResolvedValue(validConfirmation());
    mockGetUser.mockResolvedValue(null);
    expect(await confirmEmail("valid")).toEqual({ success: false, error: "User not found" });
  });

  it("returns success with user on valid token", async () => {
    mockGetByHash.mockResolvedValue(validConfirmation());
    mockGetUser.mockResolvedValue(fakeUser);
    expect(await confirmEmail("valid")).toEqual({ success: true, user: fakeUser });
  });

  it("marks token as used and user as confirmed", async () => {
    mockGetByHash.mockResolvedValue(validConfirmation());
    mockGetUser.mockResolvedValue(fakeUser);
    await confirmEmail("valid");
    expect(mockMarkUsed).toHaveBeenCalledWith("conf-1");
    expect(mockMarkConfirmed).toHaveBeenCalledWith("user-1");
  });

  it("does not mark anything on invalid token", async () => {
    mockGetByHash.mockResolvedValue(null);
    await confirmEmail("bad");
    expect(mockMarkUsed).not.toHaveBeenCalled();
    expect(mockMarkConfirmed).not.toHaveBeenCalled();
  });
});