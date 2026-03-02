"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [error, setError] = useState<string>("");
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    searchParams.then((params) => {
      if (params.token) {
        setToken(params.token);
      } else {
        setStatus("error");
        setError("No confirmation token provided");
      }
    });
  }, [searchParams]);

  useEffect(() => {
    if (!token) return;

    const confirmAndLogin = async () => {
      try {
        // Call your API route
        const response = await fetch(`/auth/confirm?token=${token}`);
        
        if (response.redirected) {
          // If the API redirects, follow it
          router.push(response.url);
        } else {
          const data = await response.json();
          setStatus("error");
          setError(data.error || "Confirmation failed");
        }
      } catch (err) {
        setStatus("error");
        setError("An error occurred");
        console.error(err);
      }
    };

    confirmAndLogin();
  }, [token, router]);

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Confirming your email...</h1>
          <p className="text-gray-600">Please wait while we confirm your email.</p>
        </div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Confirmation failed</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <a href="/login" className="text-blue-600 hover:underline">Go to Login</a>
        </div>
      </main>
    );
  }

  return null;
}