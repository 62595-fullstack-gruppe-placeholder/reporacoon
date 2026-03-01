import { describe, it, expect, vi, beforeEach } from "vitest";
import { refreshAccessToken } from "../accessToken";
import * as keys from "../keys";
import * as jose from "jose";
import * as tokenRepo from "../../repository/refreshToken/refreshTokenRepository";
import * as userRepo from "../../repository/user/userRepository"; 
import crypto from "crypto";

// Kill the server-only guardrail globally for this test
vi.mock('server-only', () => ({}));

// Mock your internal logic
vi.mock("../keys");
vi.mock("../../repository/refreshToken/refreshTokenRepository");
vi.mock("../../repository/user/userRepository");

// Robust Class Mock for Jose (Prevents the .setProtectedHeader error)
vi.mock("jose", () => {
  class MockSignJWT {
    payload: any;
    constructor(payload: any) { this.payload = payload; }
    setProtectedHeader() { return this; }
    setIssuedAt() { return this; }
    setExpirationTime() { return this; }
    async sign() { return "fake-signed-access-token"; }
  }
  return {
    SignJWT: MockSignJWT,
    jwtVerify: vi.fn(),
  };
});

describe("refreshAccessToken", () => {
  const fakeRawToken = "fake-raw-token";
  const fakeUserId = "user-123";
  const fakeJti = "token-123";

  beforeEach(() => {
    vi.resetAllMocks();

    // Setup default successful keys
    vi.mocked(keys.loadKeys).mockResolvedValue({ 
      publicKey: {} as any, 
      privateKey: {} as any 
    });
  });

  it("should successfully return a new access token", async () => {
    // Mock JWT Verify to return JTI and SUB
    vi.mocked(jose.jwtVerify).mockResolvedValue({
      payload: { sub: fakeUserId, jti: fakeJti }
    } as any);

    // Mock DB lookup (Must use getRefreshTokenById)
    const expectedHash = crypto.createHash("sha256").update(fakeRawToken).digest("hex");
    vi.mocked(tokenRepo.getRefreshTokenById).mockResolvedValue({
      id: fakeJti,
      user_id: fakeUserId,
      token_hash: expectedHash,
      expires_at: new Date(Date.now() + 100000).toISOString(),
      revoked_at: null,
    });

    // Mock User lookup
    vi.mocked(userRepo.getUserById).mockResolvedValue({ 
      id: fakeUserId, 
      email: "test@test.com",
      email_confirmed: true 
    } as any);

    const result = await refreshAccessToken(fakeRawToken);

    expect(result).toBe("fake-signed-access-token");
    expect(tokenRepo.getRefreshTokenById).toHaveBeenCalledWith(fakeJti);
  });

  it("should throw an error if the token is revoked", async () => {
    vi.mocked(jose.jwtVerify).mockResolvedValue({
      payload: { sub: fakeUserId, jti: fakeJti }
    } as any);

    vi.mocked(tokenRepo.getRefreshTokenById).mockResolvedValue({
      id: fakeJti,
      user_id: fakeUserId,
      token_hash: "irrelevant",
      expires_at: new Date(Date.now() + 100000).toISOString(),
      revoked_at: new Date().toISOString(),
    });

    await expect(refreshAccessToken(fakeRawToken)).rejects.toThrow("Session expired. Please log in again.");
  });
});