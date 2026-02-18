"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock } from "lucide-react";
import { signup, SignupInput } from "./signup";
import {
  signupFormSchema,
  SignupFormSchema,
} from "@/lib/repository/user/userSchemas";
import { SubmitButton } from "../_components/SubmitButton";

export function SignupForm() {
  const form = useForm<SignupFormSchema>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit(async (data: SignupFormSchema) => {
    const input: SignupInput = {
      email: data.email,
      password: data.password,
    };
    await signup(input);
    form.reset();
  });

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 max-w-md mx-auto p-6 box shadow-md"
    >
      <div>
        <label
          htmlFor="email"
          className="block text-secondary text-sm font-medium mb-1"
        >
          Email
        </label>
        <div className="field relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary w-4 h-4" />
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            {...form.register("email")}
            className="w-full pl-10 pr-4 py-2 bg-transparent border-0 text-text-main placeholder:text-secondary focus:ring-0 focus:outline-none"
          />
        </div>
        {form.formState.errors.email && (
          <p className="mt-1 text-sm text-red-500">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-secondary text-sm font-medium mb-1"
        >
          Password
        </label>
        <div className="field relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary w-4 h-4" />
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            {...form.register("password")}
            className="w-full pl-10 pr-4 py-2 bg-transparent border-0 text-text-main placeholder:text-secondary focus:ring-0 focus:outline-none"
          />
        </div>
        {form.formState.errors.password && (
          <p className="mt-1 text-sm text-red-500">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-secondary text-sm font-medium mb-1"
        >
          Confirm Password
        </label>
        <div className="field relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary w-4 h-4" />
          <input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            {...form.register("confirmPassword")}
            className="w-full pl-10 pr-4 py-2 bg-transparent border-0 text-text-main placeholder:text-secondary focus:ring-0 focus:outline-none"
          />
        </div>
        {form.formState.errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-500">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      <SubmitButton text="Sign Up" loadingText="Creating Account..." />
    </form>
  );
}

