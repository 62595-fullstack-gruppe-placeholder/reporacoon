/**
 * RecurringForm tests
 *
 * Test flow:
 * 1. Empty state  — form renders correctly with no existing scans
 * 2. Form inputs  — interval dropdown has all options, defaults to WEEKLY
 * 3. Submit       — calls server action with correct URL, interval, and deep-scan flag
 * 4. Submit OK    — clears the URL input after a successful submission
 * 5. Submit error — shows an error message when the server action fails
 * 6. Deep scan    — passes isDeepScan=true when the checkbox is ticked
 * 7. Scan list    — renders a row per scan, shows Active/Paused badge
 * 8. Delete       — calls deleteRecursiveScanAction with the scan id
 * 9. Pause/resume — calls toggleRecursiveScanAction with the scan id
 * 10. Run now     — calls runRecursiveScanNowAction with the scan id
 * 11. Expand OK   — fetches results and renders ScanResults on row expand
 * 12. Expand empty — shows "No scans have run yet" when jobs list is empty
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RecurringForm } from "../RecurringForm";
import * as actions from "@/app/RecursiveScanServerActions";
import { RecursiveScan } from "@/lib/repository/recursiveScan/recursiveScanSchema";

// ---- Mocks ----

vi.mock("@/app/RecursiveScanServerActions", () => ({
  createRecursiveScanAction: vi.fn(),
  deleteRecursiveScanAction: vi.fn(),
  toggleRecursiveScanAction: vi.fn(),
  runRecursiveScanNowAction: vi.fn(),
  getRecurringScanResultsAction: vi.fn(),
}));

vi.mock("@/app/_components/ScanResults", () => ({
  default: () => <div data-testid="scan-results">Scan Results</div>,
}));

// ---- Helpers ----

const FUTURE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const PAST = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

function makeScan(overrides: Partial<RecursiveScan> = {}): RecursiveScan {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    repo_url: "https://github.com/owner/repo",
    owner_id: "00000000-0000-0000-0000-000000000099",
    interval: "WEEKLY",
    is_deep_scan: false,
    extensions: [],
    is_active: true,
    last_run_at: PAST,
    next_run_at: FUTURE,
    created_at: PAST,
    ...overrides,
  };
}

// ---- Tests ----

describe("RecurringForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Empty state

  it("shows empty state message when there are no scans", () => {
    render(<RecurringForm initialScans={[]} isDeep={false} extensions={new Set<string>}/>);
    expect(screen.getByText("No recurring scans yet.")).toBeInTheDocument();
  });

  it("renders the schedule form heading", () => {
    render(<RecurringForm initialScans={[]} isDeep={false} extensions={new Set<string>}/>);
    expect(screen.getByText("Schedule a recurring scan")).toBeInTheDocument();
  });

  // 2. Form inputs

  it("renders all interval options in the dropdown", () => {
    render(<RecurringForm initialScans={[]} isDeep={false} extensions={new Set<string>}/>);
    const select = screen.getByRole("combobox");
    const options = Array.from(select.querySelectorAll("option")).map((o) => o.value);
    expect(options).toContain("WEEKLY");
    expect(options).toContain("DAILY");
    expect(options).toContain("MONTHLY");
    expect(options).toContain("HOURLY");
    expect(options).toContain("YEARLY");
  });

  it("defaults interval to WEEKLY", () => {
    render(<RecurringForm initialScans={[]} isDeep={false} extensions={new Set<string>}/>);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("WEEKLY");
  });

  // 3. Submit, correct args

  it("calls createRecursiveScanAction with the entered URL and selected interval", async () => {
    (actions.createRecursiveScanAction as Mock).mockResolvedValue({ success: true });

    render(<RecurringForm initialScans={[]} isDeep={false} extensions={new Set<string>}/>);

    fireEvent.change(screen.getByPlaceholderText("Paste a public GitHub repository URL"), {
      target: { value: "https://github.com/owner/repo" },
    });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "DAILY" } });
    fireEvent.click(screen.getByRole("button", { name: /schedule scan/i }));

    await waitFor(() => {
      expect(actions.createRecursiveScanAction).toHaveBeenCalledWith(
        "https://github.com/owner/repo",
        "DAILY",
        false,
      );
    });
  });

  // 4. Submit OK, clears input

  it("clears the URL input after a successful submission", async () => {
    (actions.createRecursiveScanAction as Mock).mockResolvedValue({ success: true });

    render(<RecurringForm initialScans={[]} isDeep={false} extensions={new Set<string>}/>);

    const input = screen.getByPlaceholderText("Paste a public GitHub repository URL") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "https://github.com/owner/repo" } });
    fireEvent.click(screen.getByRole("button", { name: /schedule scan/i }));

    await waitFor(() => expect(input.value).toBe(""));
  });

  // 5. Submit error

  it("shows an error message when createRecursiveScanAction fails", async () => {
    (actions.createRecursiveScanAction as Mock).mockResolvedValue({
      success: false,
      error: "Invalid GitHub URL",
    });

    render(<RecurringForm initialScans={[]} isDeep={false} extensions={new Set<string>}/>);

    fireEvent.change(screen.getByPlaceholderText("Paste a public GitHub repository URL"), {
      target: { value: "not-a-url" },
    });
    fireEvent.click(screen.getByRole("button", { name: /schedule scan/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid GitHub URL")).toBeInTheDocument();
    });
  });

  // 6. Deep scan flag

  it("passes isDeepScan=true when the deep scan checkbox is checked", async () => {
    (actions.createRecursiveScanAction as Mock).mockResolvedValue({ success: true });

    render(<RecurringForm initialScans={[]} isDeep={false} extensions={new Set<string>}/>);

    fireEvent.change(screen.getByPlaceholderText("Paste a public GitHub repository URL"), {
      target: { value: "https://github.com/owner/repo" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /schedule scan/i }));

    await waitFor(() => {
      expect(actions.createRecursiveScanAction).toHaveBeenCalledWith(
        "https://github.com/owner/repo",
        "WEEKLY",
        true,
      );
    });
  });

  // 7. Scan list

  it("renders a row for each scan in initialScans", () => {
    const scans = [
      makeScan({ id: "00000000-0000-0000-0000-000000000001", repo_url: "https://github.com/a/b" }),
      makeScan({ id: "00000000-0000-0000-0000-000000000002", repo_url: "https://github.com/c/d" }),
    ];
    render(<RecurringForm initialScans={scans} isDeep={false} extensions={new Set<string>}/>);
    expect(screen.getByText("https://github.com/a/b")).toBeInTheDocument();
    expect(screen.getByText("https://github.com/c/d")).toBeInTheDocument();
  });

  it("shows Active badge for active scans", () => {
    render(<RecurringForm initialScans={[makeScan({ is_active: true })]} isDeep={false} extensions={new Set<string>}/>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows Paused badge for inactive scans", () => {
    render(<RecurringForm initialScans={[makeScan({ is_active: false })]} isDeep={false} extensions={new Set<string>}/>);
    expect(screen.getByText("Paused")).toBeInTheDocument();
  });

  // 8. Delete

  it("calls deleteRecursiveScanAction when delete is clicked", async () => {
    (actions.deleteRecursiveScanAction as Mock).mockResolvedValue({ success: true });

    render(<RecurringForm initialScans={[makeScan()]} isDeep={false} extensions={new Set<string>}/>);
    fireEvent.click(screen.getByTitle("Delete"));

    await waitFor(() => {
      expect(actions.deleteRecursiveScanAction).toHaveBeenCalledWith(
        "00000000-0000-0000-0000-000000000001",
      );
    });
  });

  // 9. Pause / resume

  it("calls toggleRecursiveScanAction when pause is clicked", async () => {
    (actions.toggleRecursiveScanAction as Mock).mockResolvedValue({ success: true });

    render(<RecurringForm initialScans={[makeScan({ is_active: true })]} isDeep={false} extensions={new Set<string>}/>);
    fireEvent.click(screen.getByTitle("Pause"));

    await waitFor(() => {
      expect(actions.toggleRecursiveScanAction).toHaveBeenCalledWith(
        "00000000-0000-0000-0000-000000000001",
      );
    });
  });

  // 10. Run now

  it("calls runRecursiveScanNowAction when run now is clicked", async () => {
    (actions.runRecursiveScanNowAction as Mock).mockResolvedValue({ success: true });

    render(<RecurringForm initialScans={[makeScan()]} isDeep={false} extensions={new Set<string>}/>);
    fireEvent.click(screen.getByTitle("Run now"));

    await waitFor(() => {
      expect(actions.runRecursiveScanNowAction).toHaveBeenCalledWith(
        "00000000-0000-0000-0000-000000000001",
      );
    });
  });

  // 11. Expand, shows results

  it("fetches and shows results when a row is expanded", async () => {
    (actions.getRecurringScanResultsAction as Mock).mockResolvedValue({
      success: true,
      jobs: [{ id: "job-1" }],
      findings: [],
    });

    render(<RecurringForm initialScans={[makeScan()]} isDeep={false} extensions={new Set<string>}/>);
    fireEvent.click(screen.getByText("https://github.com/owner/repo"));

    await waitFor(() => {
      expect(actions.getRecurringScanResultsAction).toHaveBeenCalledWith(
        "00000000-0000-0000-0000-000000000001",
      );
      expect(screen.getByTestId("scan-results")).toBeInTheDocument();
    });
  });

  // 12. Expand, empty jobs

  it("shows 'No scans have run yet' when expanded with empty jobs", async () => {
    (actions.getRecurringScanResultsAction as Mock).mockResolvedValue({
      success: true,
      jobs: [],
      findings: [],
    });

    render(<RecurringForm initialScans={[makeScan()]} isDeep={false} extensions={new Set<string>}/>);
    fireEvent.click(screen.getByText("https://github.com/owner/repo"));

    await waitFor(() => {
      expect(screen.getByText("No scans have run yet.")).toBeInTheDocument();
    });
  });
});
