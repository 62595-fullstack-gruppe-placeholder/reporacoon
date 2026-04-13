import { describe, it, expect } from "vitest";
import { userClaimsSchema } from "../authSchemas";

describe("userClaimsSchema", () => {
  const validClaims = {
    sub: "user-123",
    ema: "valid@example.com",
    emc: true,
    tier: "free" as const,
    adm: false,
  };

  it("validates correct claims data", () => {
    const result = userClaimsSchema.safeParse(validClaims);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(validClaims);
  });

  it("rejects invalid sub (non-string)", () => {
    const invalid = { ...validClaims, sub: 123 as any };
    const result = userClaimsSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("rejects invalid email", () => {
    const invalid = { ...validClaims, ema: "invalid-email" };
    const result = userClaimsSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("rejects invalid emc (non-boolean)", () => {
    const invalid = { ...validClaims, emc: "true" as any };
    const result = userClaimsSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("rejects missing required fields", () => {
    const invalid: Partial<typeof validClaims> = { ema: "test@example.com" };
    const result = userClaimsSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
