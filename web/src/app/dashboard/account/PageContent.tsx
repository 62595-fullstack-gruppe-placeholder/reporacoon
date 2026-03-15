"use client";

import { passwordSchema, User } from "@/lib/repository/user/userSchemas";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { changePassword } from "./changePassword";
import { deleteAccount } from "./deleteAccount";

const formSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof formSchema>;

export function AccountDashboard({ user }: { user: User }) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handlePasswordChange = (data: PasswordFormData) => {
    startTransition(async () => {
      // TODO: toasts
      try {
        await changePassword(data);
        passwordForm.reset();
        setShowPasswordForm(false);
      } catch (error) {
        console.error("Password change failed:", error);
      }
    });
  };

  const handleDeleteAccount = () => {
    deleteAccount();
    setShowDeleteModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-box/30 flex flex-col justify-center items-center py-12 px-4">
      <div className="box max-w-md w-full p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <h1 className="h1">Welcome back!</h1>
          <p className="p">{user.email.split("@")[0]}</p>
        </div>

        <div className="space-y-3">
          <p className="fieldText text-center">
            Manage your account settings below.
          </p>

          <div className="space-y-2">
            <button
              className="btn w-full bg-button-main hover:bg-button-main/90 text-primary-foreground transition-all duration-200"
              onClick={() => setShowPasswordForm(true)}
              disabled={isPending}
            >
              Change password
            </button>
            <button
              className="btn w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-all duration-200"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete account
            </button>
          </div>
        </div>

        {showPasswordForm && (
          <form
            onSubmit={passwordForm.handleSubmit(handlePasswordChange)}
            className="space-y-4 pt-4 border-t border-border/50"
          >
            <div>
              <label className="fieldText block mb-2">Current password</label>
              <input
                type="password"
                {...passwordForm.register("currentPassword")}
                className="field w-full border-2 border-border/70 
             focus:border-text-main/80 focus:ring-2 focus:ring-button-main/40 
             focus:ring-offset-1 focus:ring-offset-box/50"
                disabled={isPending}
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="fieldText text-destructive text-xs mt-1">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="fieldText block mb-2">New password</label>
              <input
                type="password"
                {...passwordForm.register("newPassword")}
                className="field w-full border-2 border-border/70 
             focus:border-text-main/80 focus:ring-2 focus:ring-button-main/40 
             focus:ring-offset-1 focus:ring-offset-box/50"
                disabled={isPending}
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="fieldText text-destructive text-xs mt-1">
                  {passwordForm.formState.errors.newPassword?.message}
                </p>
              )}
            </div>

            <div>
              <label className="fieldText block mb-2">
                Confirm new password
              </label>
              <input
                type="password"
                {...passwordForm.register("confirmPassword")}
                className="field w-full border-2 border-border/70 
             focus:border-text-main/80 focus:ring-2 focus:ring-button-main/40 
             focus:ring-offset-1 focus:ring-offset-box/50"
                disabled={isPending}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="fieldText text-destructive text-xs mt-1">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="btn flex-1 bg-button-main hover:bg-button-main/90 text-primary-foreground disabled:opacity-50"
                disabled={isPending || passwordForm.formState.isSubmitting}
              >
                {isPending ? "Updating..." : "Update password"}
              </button>
              <button
                type="button"
                className="btn flex-1 bg-muted text-muted-foreground hover:bg-muted/80"
                onClick={() => {
                  passwordForm.reset();
                  setShowPasswordForm(false);
                }}
                disabled={isPending}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="pt-6 border-t border-border/50">
          <p className="fieldText text-xs text-center opacity-75">
            Email: {user.email}
          </p>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="box max-w-sm w-full p-6 rounded-2xl space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-destructive/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🗑️</span>
              </div>
              <h2 className="text-xl font-bold text-text-main mb-2">
                Delete account?
              </h2>
              <p className="fieldText">
                This action cannot be undone. All your data will be permanently
                deleted.
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                className="btn flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                onClick={handleDeleteAccount}
              >
                Yes, delete
              </button>
              <button
                className="btn flex-1 bg-muted text-muted-foreground hover:bg-muted/80"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
