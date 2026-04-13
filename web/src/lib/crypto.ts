import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const key = process.env.TOKEN_ENCRYPTION_KEY;
if (!key) throw new Error("TOKEN_ENCRYPTION_KEY is not set");
const SECRET_KEY = Buffer.from(key, "hex");

export function encryptToken(token: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, SECRET_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, encrypted].map(b => b.toString("base64")).join(":");
}

export function decryptToken(stored: string): string {
  const [iv, authTag, encrypted] = stored.split(":").map(s => Buffer.from(s, "base64"));
  const decipher = createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted).toString("utf8") + decipher.final("utf8");
}