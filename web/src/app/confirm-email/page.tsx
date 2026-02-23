import { confirmEmail } from "@/lib/email/emailConfirmationService";
import { redirect } from "next/navigation";

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <main><p>Invalid confirmation link.</p></main>;
  }

  const result = await confirmEmail(token);

  if (!result.success) {
    return <main><p>Error: {result.error}</p></main>;
  }

  redirect("/dashboard");
}