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

    s = XRegExp.replace(s, XRegExp("([\\p{Han}，、“”0-9]*\\p{Han}[\\p{Han}，、“”0-9]*)", "g"),
    `<span class="zh-speak">$1</span>`);

    return md.makeHtml(s);
}
