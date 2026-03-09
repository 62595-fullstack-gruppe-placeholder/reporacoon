// src/app/confirm-email/confirmed/_test/confirmed.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockClose = vi.fn();
const mockPostMessage = vi.fn();
vi.stubGlobal("BroadcastChannel", vi.fn().mockImplementation(() => ({
  postMessage: mockPostMessage,
  close: mockClose,
})));

import ConfirmedPage from "../page";

beforeEach(() => vi.clearAllMocks());

describe("ConfirmedPage", () => {
  it("broadcasts confirmed message on mount", () => {
    render(<ConfirmedPage />);
    expect(mockPostMessage).toHaveBeenCalledWith("confirmed");
  });

  it("closes the channel after broadcasting", () => {
    render(<ConfirmedPage />);
    expect(mockClose).toHaveBeenCalled();
  });

  it("redirects to dashboard on mount", () => {
    render(<ConfirmedPage />);
    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });

  it("renders nothing", () => {
    const { container } = render(<ConfirmedPage />);
    expect(container.firstChild).toBeNull();
  });
});