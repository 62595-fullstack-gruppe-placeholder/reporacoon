// vitest.setup.ts
import '@testing-library/jest-dom';


// Mock "matchMedia" because the sonner component requires it, and without the mock tests will fail.
import { vi } from "vitest";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),           // deprecated
    removeListener: vi.fn(),        // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});