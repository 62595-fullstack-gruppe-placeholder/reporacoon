import { getAllUsers } from "@/lib/repository/user/userRepository";
import { SignupForm } from "./SignupForm";

export default async function Signup() {
  try {
    const users = await getAllUsers();
    return (
      <main>
        <h1>This is a signup page</h1>
        <p>current users: {JSON.stringify(users)}</p>
        <SignupForm />
      </main>
    );
  } catch {
    return <main>
      <h1>An unknown error occured</h1>
    </main>
  }
}
