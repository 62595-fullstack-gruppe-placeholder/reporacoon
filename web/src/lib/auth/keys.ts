import { readFile } from "fs/promises";
import { importPKCS8, importSPKI } from "jose";

let privateKey: Awaited<ReturnType<typeof importPKCS8>>;
let publicKey: Awaited<ReturnType<typeof importSPKI>>;

/**
 * Load access token key pair. Since keys are stored in the module scope, they are only loaded once.
 * @returns public and private keys
 */
export async function loadKeys() {
  if (!privateKey || !publicKey) {
    const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH!;
    const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH!;

    const [privatePem, publicPem] = await Promise.all([
      readFile(privateKeyPath, "utf8"),
      readFile(publicKeyPath, "utf8"),
    ]);

    privateKey = await importPKCS8(privatePem, "RS256");
    publicKey = await importSPKI(publicPem, "RS256");
  }
  return { privateKey, publicKey };
}
