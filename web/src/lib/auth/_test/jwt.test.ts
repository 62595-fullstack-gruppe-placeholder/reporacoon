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
      settings: null,
    };

    const claims = userToClaims(user);

    expect(claims).toEqual({
      sub: "user-123",
      ema: "test@example.com",
      emc: true,
    });
  });
});

describe("claimsToUser", () => {
  it("returns a User when payload matches schema", () => {
    const payload: JWTPayload = {
      sub: "user-456",
      ema: "user@example.com",
      emc: false,
    } as unknown as JWTPayload;

    const user = claimsToUser(payload);

    expect(user).toEqual({
      id: "user-456",
      email: "user@example.com",
      email_confirmed: false,
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
