import { describe, test, expect, vi, beforeEach } from "vitest";
import { getNow } from "../timeUtil";
import { log } from "./";

// Mock getNow to control timestamps in tests
vi.mock("../timeUtil", () => ({
  getNow: vi.fn(),
}));

describe("log", () => {
  const mockGetNow = getNow as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetNow.mockReturnValue(1234567890);
  });

  test("logs error message to console.error regardless of environment", () => {
    const mockConsoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const mockConsoleDebug = vi
      .spyOn(console, "debug")
      .mockImplementation(() => {});

    log("Test error message", "error");

    expect(mockConsoleError).toHaveBeenCalledWith(
      "[1234567890] error: Test error message",
    );
    expect(mockConsoleDebug).not.toHaveBeenCalled();

    mockConsoleError.mockRestore();
    mockConsoleDebug.mockRestore();
  });

  test("logs debug message to console.debug when REPORACOON_DEBUG=true", () => {
    const mockConsoleDebug = vi
      .spyOn(console, "debug")
      .mockImplementation(() => {});
    process.env.REPORACOON_DEBUG = "true";

    log("Test debug message", "debug");

    expect(mockConsoleDebug).toHaveBeenCalledWith(
      "[1234567890] debug: Test debug message",
    );

    mockConsoleDebug.mockRestore();
    delete process.env.REPORACOON_DEBUG;
  });

  test("does not log debug message when REPORACOON_DEBUG is not true", () => {
    const mockConsoleDebug = vi
      .spyOn(console, "debug")
      .mockImplementation(() => {});
    process.env.REPORACOON_DEBUG = "false";

    log("Test debug message", "debug");

    expect(mockConsoleDebug).not.toHaveBeenCalled();

    mockConsoleDebug.mockRestore();
    delete process.env.REPORACOON_DEBUG;
  });

  test("formats log message with current timestamp and level", () => {
    const mockConsoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockGetNow.mockReturnValue(987654321);

    log("Formatted test message", "error");

    expect(mockConsoleError).toHaveBeenCalledWith(
      "[987654321] error: Formatted test message",
    );

    mockConsoleError.mockRestore();
  });
});
