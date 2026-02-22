import { describe, test, expect } from "vitest";
import { getNow, getFuture } from "./timeUtil";

describe("timeUtil", () => {
  describe("getNow", () => {
    test("returns current timestamp in seconds", () => {
      const now = getNow();
      expect(now).toBeTypeOf("number");
      expect(now).toBeGreaterThan(0);
      expect(Math.floor(now)).toBe(now); // ensures it's an integer
    });

    test("returns consistent value within same millisecond", () => {
      const now1 = getNow();
      const now2 = getNow();
      expect(now1).toBeLessThanOrEqual(now2);
      expect(Math.abs(now1 - now2)).toBeLessThanOrEqual(1);
    });
  });

  describe("getFuture", () => {
    test("returns future timestamp when offset is positive integer", () => {
      const offset = 3600; // 1 hour
      const future = getFuture(offset);
      const now = getNow();
      expect(future).toBe(now + offset);
    });

    test("floors non-integer positive offset", () => {
      const future2_5 = getFuture(2.5);
      const future2 = getFuture(2);
      expect(future2_5).toBe(future2);
    });

    test("throws Error when offset is zero", () => {
      expect(() => getFuture(0)).toThrow("offset must be positive");
    });

    test("throws Error when offset is negative", () => {
      expect(() => getFuture(-3600)).toThrow("offset must be positive");
    });
  });
});
