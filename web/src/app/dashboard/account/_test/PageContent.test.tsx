import { describe, it, expect, vi, beforeEach } from "vitest";
import { AccountDashboard } from "../PageContent";
import * as passwordActionModule from "../changePassword";
import * as deleteAccountModule from "../deleteAccount";
import { User } from "@/lib/repository/user/userSchemas";
import { useForm } from "react-hook-form";
import { fireEvent, render, waitFor } from "@testing-library/react";

vi.mock("../changePassword");
vi.mock("../deleteAccount");
vi.mock("react-hook-form");
vi.mock("server-only", () => ({}));

const mockUser: User = {
  id: "user123",
  email: "test@example.com",
  email_confirmed: true,
};

const mockUseForm = useForm as any;
const mockFormMethods = {
  register: vi.fn().mockReturnValue({ onChange: vi.fn(), onBlur: vi.fn() }),
  handleSubmit: vi.fn((fn) => fn),
  formState: { errors: {}, isSubmitting: false },
  reset: vi.fn(),
};

vi.mocked(mockUseForm).mockReturnValue(mockFormMethods);

describe("AccountDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFormMethods.formState = { errors: {}, isSubmitting: false };
    (passwordActionModule.changePassword as any).mockResolvedValue(undefined);
    (deleteAccountModule.deleteAccount as any).mockResolvedValue(undefined);
  });

  it("renders user email correctly", () => {
    const screen = render(<AccountDashboard user={mockUser} />);

    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("shows password form when Change password button is clicked", async () => {
    const screen = render(<AccountDashboard user={mockUser} />);

    const changePasswordBtn = screen.getByRole("button", {
      name: "Change password",
    });
    fireEvent.click(changePasswordBtn);

    await waitFor(() => {
      expect(screen.getByText("Current password")).toBeInTheDocument(); // Use text instead
    });
  });

  it("shows delete modal when Delete account button is clicked", async () => {
    const screen = render(<AccountDashboard user={mockUser} />);

    const deleteBtn = screen.getByRole("button", { name: "Delete account" });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.getByText("Delete account?")).toBeInTheDocument();
    });
  });

  it("closes delete modal when Cancel is clicked", async () => {
    const screen = render(<AccountDashboard user={mockUser} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete account" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.queryByText("Delete account?")).not.toBeInTheDocument();
    });
  });

  it("calls changePassword action on form submit", async () => {
    const screen = render(<AccountDashboard user={mockUser} />);

    fireEvent.click(screen.getByRole("button", { name: "Change password" }));
    const submitBtn = screen.getByRole("button", { name: "Update password" });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(passwordActionModule.changePassword).toHaveBeenCalled();
    });
  });

  it("calls deleteAccount and closes modal on delete confirmation", async () => {
    const screen = render(<AccountDashboard user={mockUser} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete account" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, delete" }));

    await waitFor(() => {
      expect(deleteAccountModule.deleteAccount).toHaveBeenCalled();
    });
  });

  it("shows pending state during form submission", async () => {
    const screen = render(<AccountDashboard user={mockUser} />);

    fireEvent.click(screen.getByRole("button", { name: "Change password" }));
    const submitBtn = screen.getByRole("button", { name: "Update password" });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(submitBtn).toHaveAttribute("disabled");
    });
  });

  it("resets form and hides form on cancel", async () => {
    const screen = render(<AccountDashboard user={mockUser} />);

    fireEvent.click(screen.getByRole("button", { name: "Change password" }));
    const cancelBtn = screen.getByRole("button", { name: "Cancel" });

    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(
        screen.queryByLabelText("Current password"),
      ).not.toBeInTheDocument();
    });
    expect(mockFormMethods.reset).toHaveBeenCalled();
  });
});
