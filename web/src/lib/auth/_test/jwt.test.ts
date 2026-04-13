import { describe, it, expect, vi } from "vitest";

// Mock server-only so Vitest can import the module in jsdom
vi.mock("server-only", () => ({}));

import { userToClaims, claimsToUser } from "../jwt";
import type { JWTPayload } from "jose";
import { User } from "@/lib/repository/user/userSchemas";

describe("userToClaims", () => {
  it("maps a User to UserClaims", () => {
    const user: User = {
      id: "user-123",
      email: "test@example.com",
      email_confirmed: true,
      tier: "free",
      is_admin: false,
      settings: null,
    };

    const claims = userToClaims(user);

    expect(claims).toEqual({
      sub: "user-123",
      ema: "test@example.com",
      emc: true,
      tier: "free",
      adm: false,
    });
  });
});

describe("claimsToUser", () => {
  it("returns a User when payload matches schema", () => {
    const payload: JWTPayload = {
      sub: "user-456",
      ema: "user@example.com",
      emc: false,
      tier: "pro",
      adm: true,
    } as unknown as JWTPayload;

    const user = claimsToUser(payload);

    expect(user).toEqual({
      id: "user-456",
      email: "user@example.com",
      email_confirmed: false,
      tier: "pro",
      is_admin: true,
      settings: null,
    });
  });

  it("returns null when required claims are missing/invalid", () => {
    // missing `sub`, for example
    const invalidPayload: JWTPayload = {
      ema: "user@example.com",
      emc: true,
    } as unknown as JWTPayload;

    const user = claimsToUser(invalidPayload);

    expect(user).toBeNull();
  });
});
