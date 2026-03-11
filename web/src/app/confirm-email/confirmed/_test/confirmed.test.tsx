import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockClose = vi.fn();
const mockPostMessage = vi.fn();

class MockBroadcastChannel {
  onmessage: any = null;
  postMessage = mockPostMessage;
  close = mockClose;
  constructor(_name: string) {}
}
vi.stubGlobal("BroadcastChannel", MockBroadcastChannel);

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