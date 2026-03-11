import { describe, it, expect, vi, type Mock } from "vitest";
import { render, screen } from "@testing-library/react";
import RootLayout from "../layout";
import * as authModule from "@/lib/auth/userFromToken";

// Mock the async getUser function
vi.mock("@/lib/auth/userFromToken", () => ({
  getUser: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn().mockReturnValue("path"),
}));

// Mock the Header component
vi.mock("./_components/Header", () => ({
  default: ({ user }: { user: any }) => (
    <header data-testid="header" data-user-name={user?.name || "guest"}>
      Header for {user?.name || "guest"}
    </header>
  ),
}));

// Mock Next.js font to avoid font loading issues
vi.mock("next/font/google", () => ({
  Inter: vi.fn(() => ({
    variable: "--font-inter",
    className: "",
  })),
}));

vi.mock("server-only", () => ({}));

describe("RootLayout", () => {
  it("renders Header with user data", async () => {
    const mockUser = { email: "johndoe@example.com" };
    (authModule.getUser as Mock).mockResolvedValue(mockUser);

    render(await RootLayout({ children: <div>Content</div> } as any));

    const header = screen.getByTestId("header");
    expect(header).toBeInTheDocument();
    const authButtons = screen.getByTestId("authbuttons");
    expect(authButtons).toBeInTheDocument();
    expect(authButtons).toHaveAttribute("data-user-name", "authed");
  });

  it("renders children content", async () => {
    const mockUser = { name: "Test User" };
    (authModule.getUser as Mock).mockResolvedValue(mockUser);

    render(
      await RootLayout({
        children: <div data-testid="children">Page content</div>,
      } as any),
    );

    const children = screen.getByTestId("children");
    expect(children).toBeInTheDocument();
    expect(children).toHaveTextContent("Page content");
  });

  it("handles guest user (null) correctly", async () => {
    (authModule.getUser as Mock).mockResolvedValue(null);

    render(await RootLayout({ children: <div>Content</div> } as any));

    const header = screen.getByTestId("header");
    expect(header).toBeInTheDocument();
    const authButtons = screen.getByTestId("authbuttons");
    expect(authButtons).toBeInTheDocument();
    expect(authButtons).toHaveAttribute("data-user-name", "guest");
  });
});
