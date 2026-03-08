import { describe, it, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";
import { getUser } from "../userFromToken";
import { loadKeys } from "../keys";
import { getAccessTokenCookie } from "../cookies";
import { claimsToUser } from "../jwt";

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock jose
vi.mock("jose", () => ({
  jwtVerify: vi.fn(),
}));

// Mock local modules
vi.mock("../keys", () => ({
  loadKeys: vi.fn(),
}));

vi.mock("../cookies", () => ({
  getAccessTokenCookie: vi.fn(),
}));

vi.mock("../jwt", () => ({
  claimsToUser: vi.fn(),
}));

const mockJwtVerify = vi.mocked(jwtVerify);
const mockLoadKeys = vi.mocked(loadKeys);
const mockGetAccessTokenCookie = vi.mocked(getAccessTokenCookie);
const mockClaimsToUser = vi.mocked(claimsToUser);

describe("getUser", () => {
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    email_confirmed: true,
  };

  const mockPublicKey = { kty: "RSA" } as any;
  const mockPrivateKey = { kty: "RSA" } as any; // ✅ Fixed: proper private key
  const mockPayload = {
    sub: "user-123",
    ema: "test@example.com",
    emc: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no access token cookie", async () => {
    mockGetAccessTokenCookie.mockResolvedValue(undefined);

    const result = await getUser();

    expect(result).toBeNull();
    expect(mockGetAccessTokenCookie).toHaveBeenCalledOnce();
    expect(mockLoadKeys).not.toHaveBeenCalled();
    expect(mockJwtVerify).not.toHaveBeenCalled();
  });

  it("returns user when valid access token", async () => {
    // ✅ Fixed: proper keys object with both privateKey AND publicKey
    mockGetAccessTokenCookie.mockResolvedValue({
      name: "access-token",
      value: "valid.jwt.token",
    });
    mockLoadKeys.mockResolvedValue({
      publicKey: mockPublicKey,
      privateKey: mockPrivateKey,
    });
    mockJwtVerify.mockResolvedValue({ payload: mockPayload } as any);
    mockClaimsToUser.mockReturnValue(mockUser);

    const result = await getUser();

    expect(mockGetAccessTokenCookie).toHaveBeenCalledOnce();
    expect(mockLoadKeys).toHaveBeenCalledOnce();
    expect(mockJwtVerify).toHaveBeenCalledWith(
      "valid.jwt.token",
      mockPublicKey,
      {
        issuer: "reporacoon",
        audience: "reporacoon",
      },
    );
    expect(mockClaimsToUser).toHaveBeenCalledWith(mockPayload);
    expect(result).toEqual(mockUser);
  });

  it("returns null when jwtVerify returns invalid payload", async () => {
    mockGetAccessTokenCookie.mockResolvedValue({
      name: "access-token",
      value: "invalid.token",
    });
    mockLoadKeys.mockResolvedValue({
      publicKey: mockPublicKey,
      privateKey: mockPrivateKey,
    });

    mockJwtVerify.mockResolvedValue({
      payload: { wrongField: "wrong" }, // Invalid claims
    } as any);
    mockClaimsToUser.mockReturnValue(null); // claimsToUser returns null for invalid payload

    const result = await getUser();

    expect(result).toBeNull();
    expect(mockJwtVerify).toHaveBeenCalledOnce();
    expect(mockClaimsToUser).toHaveBeenCalledWith({ wrongField: "wrong" });
  });
});
