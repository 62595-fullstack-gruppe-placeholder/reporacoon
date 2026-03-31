// proxy.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { proxy } from "./proxy";
import { NextResponse } from "next/server";

vi.mock("next/server", () => ({
  NextResponse: {
    next: vi.fn(() => ({ type: "next" })),
    redirect: vi.fn((url: URL) => ({ type: "redirect", url: url.toString() })),
  },
}));

vi.mock("./lib/auth/cookies", () => ({
  deleteAuthCookies: vi.fn(),
  setAccessTokenCookie: vi.fn(),
  setRefreshTokenCookie: vi.fn(),
}));

vi.mock("@/lib/log", () => ({
  log: vi.fn(),
  LogLevel: {
    debug: "debug",
  },
}));

vi.mock("./lib/auth/userFromToken", () => ({
  getUser: vi.fn(),
}));

vi.mock("./lib/auth/accessToken", () => ({
  generateRefreshToken: vi.fn(),
  refreshAccessToken: vi.fn(),
}));

import {
  deleteAuthCookies,
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from "./lib/auth/cookies";
import { log } from "@/lib/log";
import { getUser } from "./lib/auth/userFromToken";
import {
  generateRefreshToken,
  refreshAccessToken,
} from "./lib/auth/accessToken";

function createReq(options?: {
  url?: string;
  refreshToken?: string;
  forceRefresh?: boolean;
}) {
  const url = new URL(options?.url ?? "https://example.com/dashboard");
  if (options?.forceRefresh) {
    url.searchParams.set("force-token-refresh", "true");
  }

  return {
    url: url.toString(),
    searchParams: {
      get: (s: string) => {
        return url.searchParams.get(s);
      },
      delete: (s: string) => {
        url.searchParams.delete(s);
      },
    },
    nextUrl: {
      searchParams: {
        get: (s: string) => {
          return url.searchParams.get(s);
        },
        delete: (s: string) => {
          url.searchParams.delete(s);
        },
      },
      clone: () => {
        return createReq(options);
      },
    },
    cookies: {
      get: vi.fn((name: string) => {
        if (name === "refresh-token" && options?.refreshToken) {
          return { value: options.refreshToken };
        }
        return undefined;
      }),
    },
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("proxy", () => {
  it("redirects to /login and clears cookies when no user and no refresh token", async () => {
    vi.mocked(getUser).mockResolvedValue(null);

    const req = createReq();

    const res = await proxy(req);

    expect(deleteAuthCookies).toHaveBeenCalled();
    expect(NextResponse.redirect).toHaveBeenCalledWith(expect.any(URL));
    expect((res as any).type).toBe("redirect");
    expect((res as any).url).toBe("https://example.com/login");
  });

  it("refreshes tokens when no user but refresh token exists", async () => {
    vi.mocked(getUser).mockResolvedValue(null);
    vi.mocked(refreshAccessToken).mockResolvedValue({
      accessToken: "new-access",
      user: { email_confirmed: true },
    } as any);
    vi.mocked(generateRefreshToken).mockResolvedValue("new-refresh" as any);

    const req = createReq({ refreshToken: "old-refresh" });

    const res = await proxy(req);

    expect(refreshAccessToken).toHaveBeenCalledWith("old-refresh");
    expect(setAccessTokenCookie).toHaveBeenCalledWith("new-access", res);
    expect(generateRefreshToken).toHaveBeenCalledWith({
      email_confirmed: true,
    });
    expect(setRefreshTokenCookie).toHaveBeenCalledWith("new-refresh", res);
    expect(res).toEqual({ type: "next" });
  });

  it("redirects to confirm-email when user email is not confirmed", async () => {
    vi.mocked(getUser).mockResolvedValue({
      email_confirmed: false,
    } as any);

    const req = createReq({ refreshToken: "token" });

    const res = await proxy(req);

    expect(NextResponse.redirect).toHaveBeenCalledWith(expect.any(URL));
    expect((res as any).url).toBe("https://example.com/confirm-email/pending");
  });

  it("refreshes tokens on forceRefresh=true", async () => {
    vi.mocked(getUser).mockResolvedValueOnce(null);
    vi.mocked(refreshAccessToken).mockResolvedValue({
      accessToken: "new-access",
      user: { email_confirmed: true },
    } as any);
    vi.mocked(generateRefreshToken).mockResolvedValue("new-refresh");

    const req = createReq({
      forceRefresh: true,
      url: "https://example.com/dashboard?force-token-refresh=true&x=1",
      refreshToken: "old-refresh",
    });

    await proxy(req);

    // Verify refresh happened
    expect(refreshAccessToken).toHaveBeenCalledWith("old-refresh");
    expect(setAccessTokenCookie).toHaveBeenCalled();
    expect(setRefreshTokenCookie).toHaveBeenCalled();
  });

  it("returns NextResponse.next for a valid confirmed user", async () => {
    vi.mocked(getUser).mockResolvedValue({
      email_confirmed: true,
    } as any);

    const req = createReq({ refreshToken: "token" });

    const res = await proxy(req);

    expect(NextResponse.next).toHaveBeenCalled();
    expect(res).toEqual({ type: "next" });
  });

  it("redirects to /error on thrown error", async () => {
    vi.mocked(getUser).mockRejectedValue(new Error("boom"));

    const req = createReq({ refreshToken: "token" });

    const res = await proxy(req);

    expect((res as any).url).toBe("https://example.com/error");
  });
});
