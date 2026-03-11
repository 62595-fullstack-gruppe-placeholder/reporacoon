import { describe, it, expect, vi, beforeEach } from "vitest";
import { refreshAccessToken } from "../accessToken";
import * as keys from "../keys";
import * as tokenRepo from "../../repository/refreshToken/refreshTokenRepository";
import * as userRepo from "../../repository/user/userRepository"; 
import crypto from "crypto";

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock repositories and keys
vi.mock("../keys");
vi.mock("../../repository/refreshToken/refreshTokenRepository");
vi.mock("../../repository/user/userRepository");

// Mock SignJWT
vi.mock("jose", () => {
  // We create a class that Vitest can instantiate with 'new'
  return {
    SignJWT: vi.fn().mockImplementation(function (payload) {
      return {
        // Mock the builder pattern (methods that return 'this')
        setProtectedHeader: vi.fn().mockReturnThis(),
        setIssuedAt: vi.fn().mockReturnThis(),
        setExpirationTime: vi.fn().mockReturnThis(),
        // Mock the final async signing step
        sign: vi.fn().mockResolvedValue("new-access-token-string"),
      };
    }),
    jwtVerify: vi.fn(),
  };
});

describe("refreshAccessToken", () => {
  const rawRefreshToken = "test-token-string";
  const mockUserId = "user-123";
  
  // Create the exact hash the code will expect
  const expectedHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(keys.loadKeys).mockResolvedValue({ 
      privateKey: {} as any, 
      publicKey: {} as any 
    });
  });

  it("should successfully return a new access token and user", async () => {
    const mockUser = { id: mockUserId, email: "test@test.com", email_confirmed: true };

    // FIX: Ensure 'user_id' exists in the mock because your code now uses 'storedToken.user_id'
    vi.mocked(tokenRepo.getRefreshTokenByHash).mockResolvedValue({
      user_id: mockUserId,      // Matches 'const userId = storedToken?.user_id'
      token_hash: expectedHash, // Matches 'storedToken.token_hash !== incomingHash'
      revoked_at: null,
      expires_at: new Date(Date.now() + 10000),
    } as any);

    vi.mocked(userRepo.getUserById).mockResolvedValue(mockUser as any);

    const result = await refreshAccessToken(rawRefreshToken);

    expect(result.accessToken).toBe("new-access-token-string");
    expect(result.user).toEqual(mockUser);
    expect(tokenRepo.getRefreshTokenByHash).toHaveBeenCalledWith(expectedHash);
  });

  it("should fail if the token hash does not match", async () => {
    vi.mocked(tokenRepo.getRefreshTokenByHash).mockResolvedValue({
      user_id: mockUserId,
      token_hash: "completely-different-hash", // This will trigger the mismatch throw
      revoked_at: null,
    } as any);

    await expect(refreshAccessToken(rawRefreshToken))
      .rejects.toThrow("Session expired. Please log in again.");
  });
});