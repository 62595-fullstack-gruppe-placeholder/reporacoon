import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/keys", () => ({
  loadKeys: vi.fn().mockResolvedValue({ publicKey: "mock-public-key" }),
}));
vi.mock("jose", () => ({
  jwtVerify: vi.fn(),
}));
vi.mock("@/lib/repository/user/userRepository", () => ({
  getUserById: vi.fn(),
}));

import { GET } from "../route";
import { jwtVerify } from "jose";
import { getUserById } from "@/lib/repository/user/userRepository";

const mockJwtVerify = vi.mocked(jwtVerify);
const mockGetUserById = vi.mocked(getUserById);

const fakeUser = {
  id: "user-1",
  email: "test@test.com",
  email_confirmed: true,
  password_hash: "hash",
  created_at: new Date().toISOString(),
};

const makeRequest = (cookie?: string) => {
  const req = new NextRequest("http://localhost/api/auth/me");
  if (cookie) {
    req.headers.set("cookie", `access-token=${cookie}`);
  }
  return req;
};

beforeEach(() => vi.clearAllMocks());

describe("GET /api/auth/me", () => {
  it("returns 401 if no cookie", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 if JWT is invalid", async () => {
    mockJwtVerify.mockRejectedValue(new Error("invalid signature"));
    const res = await GET(makeRequest("bad-token"));
    expect(res.status).toBe(401);
  });

  it("returns 401 if JWT has no sub", async () => {
    mockJwtVerify.mockResolvedValue({ payload: { sub: undefined } } as any);
    const res = await GET(makeRequest("token-without-sub"));
    expect(res.status).toBe(401);
  });

  it("returns 401 if user not found", async () => {
    mockJwtVerify.mockResolvedValue({ payload: { sub: "user-1" } } as any);
    mockGetUserById.mockResolvedValue(null);
    const res = await GET(makeRequest("valid-token"));
    expect(res.status).toBe(401);
  });

  it("returns 401 if user email is not confirmed", async () => {
    mockJwtVerify.mockResolvedValue({ payload: { sub: "user-1" } } as any);
    mockGetUserById.mockResolvedValue({ ...fakeUser, email_confirmed: false });
    const res = await GET(makeRequest("valid-token"));
    expect(res.status).toBe(401);
  });

  it("returns 200 for valid token and confirmed user", async () => {
    mockJwtVerify.mockResolvedValue({ payload: { sub: "user-1" } } as any);
    mockGetUserById.mockResolvedValue(fakeUser);
    const res = await GET(makeRequest("valid-token"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("looks up user by the sub from the JWT", async () => {
    mockJwtVerify.mockResolvedValue({ payload: { sub: "user-1" } } as any);
    mockGetUserById.mockResolvedValue(fakeUser);
    await GET(makeRequest("valid-token"));
    expect(mockGetUserById).toHaveBeenCalledWith("user-1");
  });
});