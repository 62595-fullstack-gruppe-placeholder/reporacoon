import { z } from "zod";

/**
 * Base user schema. Represents a row in the `users` table.
 */
export const userSchema = z.object({
  id: z.uuidv4(),
  email: z.email(),
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
  password_hash: z.string(),
});

/**
 * DTO for creating a user in the `users` table.
 */
export type CreateUserDTO = z.infer<typeof createUserDTOSchema>;

/**
 * Schema for signup form.
 */
export const signupFormSchema = z
  .object({
    email: z.email("Invalid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100),
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
