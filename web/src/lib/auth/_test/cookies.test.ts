import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import { getAccessTokenCookie, setAccessTokenCookie } from "../cookies";

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock Next.js cookies()
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
  })),
}));

const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
};

vi.mocked(cookies).mockImplementation(() => mockCookies as any);

describe("Access Token Cookies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAccessTokenCookie", () => {
    it("returns the access token cookie value", async () => {
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
      mockCookies.get.mockReturnValue({ name: "access-token", value: token });

      const result = await getAccessTokenCookie();

      expect(cookies).toHaveBeenCalledOnce();
      expect(mockCookies.get).toHaveBeenCalledOnce();
      expect(mockCookies.get).toHaveBeenCalledWith("access-token");
      expect(result).toEqual({ name: "access-token", value: token });
    });

    it("returns undefined when no access token cookie exists", async () => {
      mockCookies.get.mockReturnValue(undefined);

      const result = await getAccessTokenCookie();

      expect(result).toBeUndefined();
    });
  });

  describe("setAccessTokenCookie", () => {
    it("sets the access token cookie", async () => {
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

      await setAccessTokenCookie(token);

      expect(cookies).toHaveBeenCalledOnce();
      expect(mockCookies.set).toHaveBeenCalledOnce();
      expect(mockCookies.set).toHaveBeenCalledWith("access-token", token,
        expect.objectContaining({
          httpOnly: true,
          path: "/",
          expires: expect.any(Date)
        })
      );
    });
  });
});
