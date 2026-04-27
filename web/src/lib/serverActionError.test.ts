import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { showServerActionResponseToast } from "./serverActionError";
import { toast } from "sonner";

const mockToast = vi.mocked(toast);

describe("serverActionError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("showServerActionResponseToast shows success toast with message", () => {
    const result = { success: true, msg: "Operation completed", error: undefined } as const;

    showServerActionResponseToast(result);

    expect(mockToast.info).toHaveBeenCalledWith("Operation completed");
    expect(mockToast.success).not.toHaveBeenCalled();
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  test("showServerActionResponseToast shows default success toast when no message", () => {
    const result = { success: true, msg: undefined, error: undefined } as const;

    showServerActionResponseToast(result);

    expect(mockToast.success).toHaveBeenCalledWith("Success!");
    expect(mockToast.info).not.toHaveBeenCalled();
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  test("showServerActionResponseToast shows error toast for failure", () => {
    const result = { success: false, error: "Something went wrong" } as const;

    showServerActionResponseToast(result);

    expect(mockToast.error).toHaveBeenCalledWith("Something went wrong");
    expect(mockToast.success).not.toHaveBeenCalled();
    expect(mockToast.info).not.toHaveBeenCalled();
  });

  test("showServerActionResponseToast does nothing for null result", () => {
    showServerActionResponseToast(null);

    expect(mockToast.info).not.toHaveBeenCalled();
    expect(mockToast.success).not.toHaveBeenCalled();
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  test("showServerActionResponseToast does nothing for undefined result", () => {
    showServerActionResponseToast(undefined);

    expect(mockToast.info).not.toHaveBeenCalled();
    expect(mockToast.success).not.toHaveBeenCalled();
    expect(mockToast.error).not.toHaveBeenCalled();
  });
});
