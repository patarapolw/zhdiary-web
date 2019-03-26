import crypto from "crypto";

export async function generateSecret(): Promise<string> {
    return await new Promise((resolve, reject) => {
        crypto.randomBytes(48, (err, b) =>
        err ? reject(err) : resolve(b.toString("base64")));
    });
}
