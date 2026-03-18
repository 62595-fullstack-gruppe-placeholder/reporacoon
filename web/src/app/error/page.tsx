"use client";

import { useRouter } from "next/navigation";
import ErrorPage from "../_components/ErrorPage";

export default function Page() {
  const router = useRouter();

  return <ErrorPage reset={() => router.back()} />;
}
