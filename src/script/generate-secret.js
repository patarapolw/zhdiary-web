import crypto from 'crypto';

export function generateSecret() {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(48, (err, b) => {
            if (err) {
                return reject(err);
            }
            resolve(b.toString("base64"));
        });
    })
}

(async () => {
    console.log(await generateSecret());
})().catch(console.error);
