"use client";

import { passwordSchema, User } from "@/lib/repository/user/userSchemas";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { changePassword } from "./changePassword";
import { deleteAccount } from "./deleteAccount";
import { toast } from "sonner";
import { Lock, ShieldCheck, Trash2, Zap } from "lucide-react";

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
      try {
        await changePassword(data);
        passwordForm.reset();
        setShowPasswordForm(false);
        toast.success("Password updated");
      } catch (error) {
        toast.error("Failed to update password");
      }
    });
  };

  const handleDeleteAccount = () => {
    deleteAccount();
    setShowDeleteModal(false);
  };

  return (
    <div className="w-full flex flex-col justify-center items-center py-12 px-4 space-y-6  to-box/30">
      <div className="box max-w-md w-full p-8 space-y-8 shadow-xl border border-secondary/10 bg-gradient-to-br from-background backdrop-blur-sm">
        {/* Welcome Header */}
        <div className="text-center space-y-4 pt-4 border-b border-secondary/10 pb-4">
          <div className="p-4 bg-button-main/20 rounded-xl inline-block">
            <ShieldCheck className="text-button-main" size={48} />
          </div>
          <h1 className="h1">Welcome back!</h1>
          <h2 className="h2 font-black text-text-main">
            {user.email.split("@")[0]}
          </h2>
          <h2 className="text-sm font-mono text-secondary uppercase tracking-wider opacity-75">
            {user.email}
          </h2>
        </div>

        <div className="space-y-4">
          <p className="text-secondary font-mono text-sm text-center leading-relaxed">
            Manage your account settings below.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              className={`box w-full flex items-center justify-center gap-3 px-6 py-4 font-mono font-bold text-sm uppercase tracking-wider h-12
                     bg-button-main/20 hover:bg-button-main/30 border-2 border-button-main/30 
                     hover:border-button-main text-button-main hover:shadow-lg transition-all`}
              onClick={() => setShowPasswordForm(true)}
              disabled={isPending}
            >
              <Lock size={16} />
              Change password
            </button>
            <button
              className={`box w-full flex items-center justify-center gap-3 px-6 py-4 font-mono font-bold text-sm uppercase tracking-wider h-12
                     bg-destructive/20 hover:bg-destructive/30 border-2 border-destructive/30 
                     hover:border-destructive text-destructive hover:shadow-lg transition-all`}
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 size={16} />
              Delete account
            </button>
          </div>
        </div>

        {/* Password Form */}
        {showPasswordForm && (
          <form
            onSubmit={passwordForm.handleSubmit(handlePasswordChange)}
            className="space-y-6 pt-6 border-t border-secondary/10"
          >
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-secondary uppercase tracking-widest block mb-2">
                Current password
              </label>
              <input
                type="password"
                {...passwordForm.register("currentPassword")}
                className={`field w-full h-12 px-4 font-mono text-sm border border-secondary/20 
                       bg-text-main/5 hover:bg-text-main/10 focus:border-button-main/40 
                       focus:ring-2 focus:ring-button-main/30 focus:ring-offset-1 
                       focus:ring-offset-background/50 rounded-lg transition-all`}
                disabled={isPending}
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-[10px] font-mono text-destructive mt-1">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-secondary uppercase tracking-widest block mb-2">
                New password
              </label>
              <input
                type="password"
                {...passwordForm.register("newPassword")}
                className={`field w-full h-12 px-4 font-mono text-sm border border-secondary/20 
                       bg-text-main/5 hover:bg-text-main/10 focus:border-button-main/40 
                       focus:ring-2 focus:ring-button-main/30 focus:ring-offset-1 
                       focus:ring-offset-background/50 rounded-lg transition-all`}
                disabled={isPending}
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-[10px] font-mono text-destructive mt-1">
                  {passwordForm.formState.errors.newPassword?.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-secondary uppercase tracking-widest block mb-2">
                Confirm new password
              </label>
              <input
                type="password"
                {...passwordForm.register("confirmPassword")}
                className={`field w-full h-12 px-4 font-mono text-sm border border-secondary/20 
                       bg-text-main/5 hover:bg-text-main/10 focus:border-button-main/40 
                       focus:ring-2 focus:ring-button-main/30 focus:ring-offset-1 
                       focus:ring-offset-background/50 rounded-lg transition-all`}
                disabled={isPending}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-[10px] font-mono text-destructive mt-1">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                className={`box flex-1 flex items-center justify-center gap-3 px-6 py-4 font-mono font-bold text-sm uppercase tracking-wider h-12
                       bg-button-main/20 hover:bg-button-main/30 border-2 border-button-main/30 
                       hover:border-button-main text-button-main hover:shadow-lg transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={isPending || passwordForm.formState.isSubmitting}
              >
                <Zap size={16} />
                {isPending ? "Updating..." : "Update password"}
              </button>
              <button
                type="button"
                className={`box flex-1 flex items-center justify-center gap-3 px-6 py-4 font-mono font-bold text-sm uppercase tracking-wider h-12
                       bg-text-main/5 hover:bg-text-main/10 border border-text-main/10 hover:border-text-main/20 
                       text-secondary hover:text-text-main hover:shadow-lg transition-all`}
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
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="box max-w-sm w-full p-8 rounded-2xl space-y-6 shadow-2xl border border-destructive/20 bg-background/95">
            <div className="text-center space-y-4">
              <div className="p-6 bg-destructive/10 border-2 border-destructive/20 rounded-2xl mx-auto w-20 h-20 flex items-center justify-center">
                <Trash2 className="text-destructive" size={32} />
              </div>
              <h2 className="text-xl font-black text-text-main">
                Delete account?
              </h2>
              <p className="text-secondary font-mono text-sm leading-relaxed">
                This action cannot be undone. All your data will be permanently
                deleted.
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                className={`box flex-1 flex items-center justify-center gap-3 px-6 py-4 font-mono font-bold text-sm uppercase tracking-wider h-12
                       bg-destructive/20 hover:bg-destructive/30 border-2 border-destructive/30 
                       hover:border-destructive text-destructive hover:shadow-lg transition-all`}
                onClick={handleDeleteAccount}
              >
                <Trash2 size={16} />
                Yes, delete
              </button>
              <button
                className={`box flex-1 flex items-center justify-center gap-3 px-6 py-4 font-mono font-bold text-sm uppercase tracking-wider h-12
                       bg-text-main/5 hover:bg-text-main/10 border border-text-main/10 hover:border-text-main/20 
                       text-secondary hover:text-text-main hover:shadow-lg transition-all`}
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