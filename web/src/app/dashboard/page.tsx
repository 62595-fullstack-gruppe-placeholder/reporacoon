import { getUser } from "@/lib/auth/userFromToken";

export default async function DashboardPage() {
  const user = await getUser();
  return (
    <div>
      This is a secret page that requires authentication.
      <p>{JSON.stringify(user)}</p>
    </div>
  );
}
