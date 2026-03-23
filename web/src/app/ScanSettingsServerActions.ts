"use server";
import { getUser } from "@lib/auth/userFromToken"
import { getUserSettingsById, setUserSettingsById } from "@/lib/repository/user/userRepository";
import { Settings } from "@/lib/repository/user/userSchemas";



export async function getScanSettings(): Promise<Settings | null> {
    // Gets user from token
    const user = await getUser()
    if (!user) return null;

    const settings = await getUserSettingsById(user.id)

    return settings || null;
}

export async function updateScanSettings(formData: FormData) {
    // Gets user from token
    const user = await getUser()
    if (!user) throw new Error("Unauthorized");

    const settings = {
        extensions: (formData.get("extensions") as string).split(",").map(s => s.trim()),
        isDeep: formData.get("isDeep") === "on",
    } satisfies Settings;

    await setUserSettingsById(settings, user.id)


    return { success: true };
}