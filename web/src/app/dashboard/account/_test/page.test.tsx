// __tests__/Page.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import Page from "../page";
import * as authModule from "@/lib/auth/userFromToken";
import { AccountDashboard } from "../PageContent";

vi.mock("@/lib/auth/userFromToken");
vi.mock("../PageContent");
vi.mock("server-only", () => ({}));

describe("Account page", () => {
  const mockUser = { id: "user123", email: "test@example.com" };

  beforeEach(() => {
    vi.clearAllMocks();
    (authModule.getUser as any).mockResolvedValue(mockUser);
  });

  it("should fetch user and render AccountDashboard with user prop", async () => {
    const { render } = await import("@testing-library/react");

    const screen = render(await Page());

    expect(authModule.getUser).toHaveBeenCalled();
    expect(AccountDashboard).toHaveBeenCalledWith(
      { user: mockUser },
      undefined, // idk
    );
  });
});
