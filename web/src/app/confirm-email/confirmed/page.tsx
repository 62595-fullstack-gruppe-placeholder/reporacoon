"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmedPage() {
  const router = useRouter();

  useEffect(() => {
    const ch = new BroadcastChannel("email_confirmation");
    ch.postMessage("confirmed");
    ch.close();
    router.replace("/dashboard");
  }, []);

  return null;
}