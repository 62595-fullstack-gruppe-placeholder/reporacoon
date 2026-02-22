import { cookies } from "next/headers"
import "server-only"

const ACCESS_TOKEN_COOKIE_NAME = "access-token"

export async function getAccessTokenCookie() {
    return (await cookies()).get(ACCESS_TOKEN_COOKIE_NAME)
}

export async function setAccessTokenCookie(accessToken: string) {
    (await cookies()).set(ACCESS_TOKEN_COOKIE_NAME, accessToken)
}
