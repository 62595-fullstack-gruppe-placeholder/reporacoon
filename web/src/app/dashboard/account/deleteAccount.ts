"use server"

import { logout } from "@/app/_globalActions/logout";
import { getUser } from "@/lib/auth/userFromToken"
import { deleteUser } from "@/lib/repository/user/userRepository";

export async function deleteAccount() {
    const user = await getUser();

    if (!user) {
        throw new Error("Authentication required");
    }

    await deleteUser(user.id);

    await logout();
}