import crypto from "crypto";
import XRegExp from "xregexp";
import showdown from "showdown";

export async function generateSecret(): Promise<string> {
    return await new Promise((resolve, reject) => {
        crypto.randomBytes(48, (err, b) =>
        err ? reject(err) : resolve(b.toString("base64")));
    });
}

const md = new showdown.Converter();
md.setFlavor("github");

export function md2html(s?: string): string | undefined {
    if (!s) {
        return;
    }

    s = XRegExp.replace(s, XRegExp("=?\\p{Han}+(?:[，、“”0-9]*\\p{Han}+)*", "g"), (m: any) => {
        if (m[0] !== "=") {
            return m.replace(m, `<span class="zh-speak">${m}</span>`);
        }

        return m;
    });

    return md.makeHtml(s);
}
