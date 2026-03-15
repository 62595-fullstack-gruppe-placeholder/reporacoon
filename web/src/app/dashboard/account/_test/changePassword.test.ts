// __tests__/changePassword.test.tsx
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { changePassword } from "../changePassword";
import * as authModule from "@/lib/auth/userFromToken";
import * as userRepoModule from "@/lib/repository/user/userRepository";
import { changePasswordDTOSchema } from "@/lib/repository/user/userSchemas";

vi.mock("@/lib/auth/userFromToken");
vi.mock("@/lib/repository/user/userRepository");
vi.mock("@/lib/repository/user/userSchemas");
/* vi.mock("@/lib/repository/user/userSchemas", () => {
    const actual = vi.importActual("@/lib/repository/user/userSchemas");
    return {
        ...actual,
        changePasswordDTOSchema: vi.fn(),
    }
}); */
vi.mock("server-only", () => ({}));

describe("changePassword server action", () => {
  const mockUser = { id: "user123" };
  const mockDTO = {
    currentPassword: "oldpass",
    newPassword: "newpass123", // Flat string, not nested
    confirmPassword: "newpass123", // Flat string, not nested
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (authModule.getUser as any).mockResolvedValue(mockUser);
    (userRepoModule.changeUserPassword as any).mockResolvedValue(undefined);
  });

  it("should succeed when user is authenticated and data is valid", async () => {
    (changePasswordDTOSchema.omit as any).mockReturnValueOnce({
      parse: vi.fn().mockImplementation((data) => data),
    });

    const result = await changePassword(mockDTO);

    expect(authModule.getUser).toHaveBeenCalled();
    expect(userRepoModule.changeUserPassword).toHaveBeenCalledWith({
      currentPassword: "oldpass",
      newPassword: "newpass123",
      confirmPassword: "newpass123",
      userId: mockUser.id,
    });
    expect(result).toEqual({ success: true, error: undefined });
  });

  it("should throw error when user is not authenticated", async () => {
    (authModule.getUser as any).mockResolvedValue(null);

    await expect(changePassword(mockDTO)).rejects.toThrow(
      "Authentication required",
    );
    expect(userRepoModule.changeUserPassword).not.toHaveBeenCalled();
  });

  it("should throw error when DTO validation fails", async () => {
    const invalidDTO = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };
    const mockParse = vi.fn().mockImplementation(() => {
      throw new Error("Validation failed");
    });

    (changePasswordDTOSchema.omit as any).mockReturnValue({
      parse: mockParse,
    });

    await expect(changePassword(invalidDTO)).rejects.toThrow(
      "Validation failed",
    );
    expect(userRepoModule.changeUserPassword).not.toHaveBeenCalled();
  });

  it("should validate DTO before calling repository", async () => {
    const schemaMock = {
      parse: vi.fn().mockReturnValue(mockDTO),
    };
    (changePasswordDTOSchema.omit as any).mockReturnValue(schemaMock);

    await changePassword(mockDTO);

    expect(schemaMock.parse).toHaveBeenCalledWith(mockDTO);
  });
});
