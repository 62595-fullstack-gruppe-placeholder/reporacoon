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
    <div className="min-h-screen w-full flex justify-center pt-20 p-4">
      <form
        onSubmit={onSubmit}
        className="h-fit w-full max-w-md p-8 rounded-xl shadow-lg border border-green-200 bg-green-50 backdrop-blur-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Log in</h1>
          <p className="text-sm text-gray-500">
            Enter your credentials to access your account
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...form.register("email")}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
              />
            </div>
            {form.formState.errors.email && (
              <p className="mt-1 text-sm text-red-500 font-medium">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                {...form.register("password")}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
              />
            </div>
            {form.formState.errors.password && (
              <p className="mt-1 text-sm text-red-500 font-medium">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
        </div>

        <div className="pt-2">
          <SubmitButton text="Log in" loadingText="Logging in..." />
        </div>
      </form>
    </div>
  );
}
