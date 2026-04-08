import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/lib/repository/user/userSchemas";
import AccountDropdown from "../AccountDropdown";
import { logout } from "../../_globalActions/logout";

vi.mock("server-only", () => ({}));

const { mockedLogout } = vi.hoisted(() => ({
  mockedLogout: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("../../_globalActions/logout", () => ({
  logout: mockedLogout,
}));

const user: User = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  email: "test@example.com",
  email_confirmed: true,
  settings: null,
};

describe("AccountDropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the trigger button", () => {
    render(<AccountDropdown user={user} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("opens the dropdown and shows user email and menu items", async () => {
    const userEventSetup = userEvent.setup();

    render(<AccountDropdown user={user} />);

    await userEventSetup.click(screen.getByRole("button"));

    expect(screen.getByText("You are logged in as")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();

    expect(
      screen.getByRole("menuitem", { name: "My account" })
    ).toHaveAttribute("href", "/dashboard/account");

    expect(
      screen.getByRole("menuitem", { name: "Settings" })
    ).toHaveAttribute("href", "/dashboard/settings");
  });

  it("calls logout when Log out is selected", async () => {
    const userEventSetup = userEvent.setup();
    mockedLogout.mockResolvedValue(undefined);

    render(<AccountDropdown user={user} />);

    await userEventSetup.click(screen.getByRole("button"));
    await userEventSetup.click(screen.getByRole("menuitem", { name: "Log out" }));

    await waitFor(() => {
      expect(mockedLogout).toHaveBeenCalledTimes(1);
    });
  });

  it('shows "Logging out..." while logout is pending and resets after resolve', async () => {
    const userEventSetup = userEvent.setup();

    let resolveLogout: (() => void) | undefined;

    mockedLogout.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveLogout = resolve;
        })
    );

    render(<AccountDropdown user={user} />);

    await userEventSetup.click(screen.getByRole("button"));
    await userEventSetup.click(screen.getByRole("menuitem", { name: "Log out" }));

    await waitFor(() => {
      expect(screen.getByText("Logging out...")).toBeInTheDocument();
    });

    expect(resolveLogout).toBeDefined();
    resolveLogout?.();

    await waitFor(() => {
      expect(screen.getByText("Log out")).toBeInTheDocument();
    });
  });
});