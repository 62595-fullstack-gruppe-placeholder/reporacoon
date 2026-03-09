import { cookies } from "next/headers"
import "server-only"
import { getFuture } from "../timeUtil"

const ACCESS_TOKEN_COOKIE_NAME = "access-token"
const REFRESH_TOKEN_COOKIE_NAME = "refresh-token"

export async function getAccessTokenCookie() {
    return (await cookies()).get(ACCESS_TOKEN_COOKIE_NAME)
}

export async function setAccessTokenCookie(accessToken: string) {
    (await cookies()).set(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
        expires: getFuture(15 * 60),
        httpOnly: true,
        secure: true,
        sameSite: "lax"
    })
}

export async function setRefreshTokenCookie(refreshToken: string) {
    (await cookies()).set(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
        expires: getFuture(60 * 60 * 24 * 30),
        httpOnly: true,
        secure: true,
        sameSite: "lax"
    })
}

export async function getRefreshTokenCookie() {
    return (await cookies()).get(REFRESH_TOKEN_COOKIE_NAME)
}

export async function deleteAccessTokenCookie() {
    (await cookies()).delete(ACCESS_TOKEN_COOKIE_NAME)
}

export async function deleteRefreshTokenCookie() {
    (await cookies()).delete(REFRESH_TOKEN_COOKIE_NAME)
}
