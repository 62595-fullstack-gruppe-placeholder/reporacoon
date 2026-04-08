import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

Object.defineProperty(window, "location", {
  value: { href: "" },
  writable: true,
});

import ConfirmEmailPendingPage from "../page";

beforeEach(() => {
  vi.clearAllMocks();
  window.location.href = "";
  localStorage.setItem("pending_confirmation_email", "test@test.com");
  vi.mocked(fetch).mockResolvedValue({ ok: false } as any);
});

describe("ConfirmEmailPendingPage", () => {
  it("renders heading", () => {
    render(<ConfirmEmailPendingPage />);
    expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
  });

  it("renders resend button", () => {
    render(<ConfirmEmailPendingPage />);
    expect(screen.getByRole("button", { name: /resend confirmation email/i })).toBeInTheDocument();
  });

  it("calls resend API with email from localStorage", async () => {
    render(<ConfirmEmailPendingPage />);
    fireEvent.click(screen.getByRole("button", { name: /resend confirmation email/i }));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/auth/resend", expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "test@test.com" }),
      }));
    });
  });

  it("shows sent feedback after resend", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ confirmURL: "https://example.com/verify" }),
    } as any);

    render(<ConfirmEmailPendingPage />);
    fireEvent.click(screen.getByRole("button", { name: /resend confirmation email/i }));
    await waitFor(() => {
      expect(screen.getByText(/✓ email sent/i)).toBeInTheDocument();
    });
  });

  it("disables button while loading", async () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}) as any);
    render(<ConfirmEmailPendingPage />);
    fireEvent.click(screen.getByRole("button", { name: /resend confirmation email/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();
    });
  });
});