// @vitest-environment node

vi.mock("server-only", () => ({}));

vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
}));

vi.mock("jose", () => ({
  importPKCS8: vi.fn(),
  importSPKI: vi.fn(),
}));

// Import after mocks
import { readFile } from "fs/promises";
import { importPKCS8, importSPKI } from "jose";

const mockReadFile = vi.mocked(readFile);
const mockImportPKCS8 = vi.mocked(importPKCS8);
const mockImportSPKI = vi.mocked(importSPKI);

describe("keys", () => {
  let loadKeys: any;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    // Reset module state by re-importing or clearing cache if possible
    // Since it's module-level, we can mock the environment
    vi.stubEnv("JWT_PRIVATE_KEY_PATH", "/path/to/private.pem");
    vi.stubEnv("JWT_PUBLIC_KEY_PATH", "/path/to/public.pem");
    // Re-import the module
    const keysModule = await import("../keys");
    loadKeys = keysModule.loadKeys;
  });

  test("loadKeys loads and imports keys from files", async () => {
    const privatePem = "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----";
    const publicPem = "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----";
    const mockPrivateKey = { type: "private" };
    const mockPublicKey = { type: "public" };

    mockReadFile.mockImplementation(async (path: any) => {
      if (path === "/path/to/private.pem") return privatePem;
      if (path === "/path/to/public.pem") return publicPem;
      throw new Error("Unexpected path");
    });
    mockImportPKCS8.mockResolvedValue(mockPrivateKey);
    mockImportSPKI.mockResolvedValue(mockPublicKey);

    const result = await loadKeys();

    expect(mockReadFile).toHaveBeenCalledWith("/path/to/private.pem", "utf8");
    expect(mockReadFile).toHaveBeenCalledWith("/path/to/public.pem", "utf8");
    expect(mockImportPKCS8).toHaveBeenCalledWith(privatePem, "RS256");
    expect(mockImportSPKI).toHaveBeenCalledWith(publicPem, "RS256");
    expect(result).toEqual({ privateKey: mockPrivateKey, publicKey: mockPublicKey });
  });

  test("loadKeys caches keys after first load", async () => {
    const mockPrivateKey = { type: "private" };
    const mockPublicKey = { type: "public" };

    mockReadFile.mockResolvedValue("pem");
    mockImportPKCS8.mockResolvedValue(mockPrivateKey);
    mockImportSPKI.mockResolvedValue(mockPublicKey);

    await loadKeys();
    const result2 = await loadKeys();

    expect(mockReadFile).toHaveBeenCalledTimes(2); // Once for each file
    expect(mockImportPKCS8).toHaveBeenCalledTimes(1);
    expect(mockImportSPKI).toHaveBeenCalledTimes(1);
    expect(result2).toEqual({ privateKey: mockPrivateKey, publicKey: mockPublicKey });
  });
});
