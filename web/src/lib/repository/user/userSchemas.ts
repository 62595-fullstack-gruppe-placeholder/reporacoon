import { z } from "zod";

/**
 * Settings schema. Has the file extensions to scan and the type of scan 
 */
export const settingsSchema = z.object({
  extensions: z.array(z.string()).default([
    // Arbitrary list of extensions for the default
    ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".go", ".rb", ".php", ".yml",
  ]),
  isDeep: z.boolean().default(false),
});

export type Settings = z.infer<typeof settingsSchema>

/**
 * Base user schema. Represents a row in the `users` table.
 */
export const userSchema = z.object({
  id: z.uuidv4(),
  email: z.email(),
  email_confirmed: z.boolean(),
  tier: z.enum(["free", "pro"]).default("free"),
  is_admin: z.boolean().default(false),
  // used default from settingsSchema
  settings: settingsSchema.nullable().default(settingsSchema.parse({})),
});

/**
 * Represents a row in the `users` table.
 */
export type User = z.infer<typeof userSchema>;

/**
 * DTO for creating a user in the `users` table.
 */
export const createUserDTOSchema = z.object({
  email: z.email(),
  password: z.string(),
});

/**
 * DTO for creating a user in the `users` table.
 */
export type CreateUserDTO = z.infer<typeof createUserDTOSchema>;

/**
 * Schema used to validate passwords.
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100);

/**
 * Schema for signup form.
 */
export const signupFormSchema = z
  .object({
    email: z.email("Invalid email"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

/**
 * Signup form data.
 */
export type SignupFormSchema = z.infer<typeof signupFormSchema>;

/**
 * Schema used to validate change password DTO.
 */
export const changePasswordDTOSchema = z.object({
  userId: z.string(),
  currentPassword: z.string(),
  newPassword: passwordSchema,
})

/**
 * DTO for changing a user's password.
 */
export type ChangePasswordDTO = z.infer<typeof changePasswordDTOSchema>

/**
 * DTO for authentication credentials.
 */
export const credentialsDTOSchema = z.object({
  email: z.email(),
  password: z.string(),
});

/**
 * Inferred type of {@link credentialsDTOSchema}.
 */
export type CredentialsDTO = z.infer<typeof credentialsDTOSchema>;

/**
 * Schema for login form. Equivalent to {@link credentialsDTOSchema}.
 */
export const loginFormSchema = credentialsDTOSchema;

/**
 * Inferred type of {@link loginFormSchema}.
 */
export type LoginFormSchema = z.infer<typeof loginFormSchema>;

