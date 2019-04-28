import h from "hyperscript";
import TService from "turndown";
import { IDbDataToken, IDbDataSentence } from "../db";

export interface ITemplate {
    name: string;
    entry: string;
    front: string;
    back?: string;
    note?: string;
}

const sd = new TService();

export function getTemplateFromData(v: IDbDataToken, ss: IDbDataSentence[]): ITemplate[] {
    const back = sd.turndown(h("div", [
        h("h3", v.simplified),
        v.traditional ? h("h4", v.traditional) : h("div"),
        h("div", v.pinyin),
        h("div", v.english),
        h("ul", ss.slice(0, 10).map((s) => {
            return h("li", [
                h("span", s.chinese),
                h("ul", h("li", s.english))
            ]);
        }))
    ]).outerHTML);

    return [
        {name: "SE", front: sd.turndown(h("h4", v.simplified).outerHTML), back, entry: v.simplified!},
        {name: "EC", front: sd.turndown(h("h4", v.english).outerHTML), back, entry: v.simplified!}
    ];
}
