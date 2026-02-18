"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Lock } from "lucide-react";
import { useFormStatus } from "react-dom";
import { login } from "./login";
import {
  CredentialsDTO,
  type LoginFormSchema,
  loginFormSchema,
} from "@/lib/repository/user/userSchemas";
import { SubmitButton } from "../_components/SubmitButton";

export function LoginForm() {
  const form = useForm<LoginFormSchema>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit(async (data: LoginFormSchema) => {
    const input: CredentialsDTO = {
      email: data.email,
      password: data.password,
    };
    await login(input);
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

      <SubmitButton text="Log in" loadingText="logging in..." />
    </form>
  );
}
