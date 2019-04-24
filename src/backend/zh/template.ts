import { IDbDataVocab, IDbDataSentence } from "../db";
import showdown from "showdown";
import h from "hyperscript";

export interface ITemplate {
    name: string;
    entry: string;
    front: string;
    back?: string;
    note?: string;
}

const sd = new showdown.Converter();

export function getTemplateFromData(v: IDbDataVocab, ss: IDbDataSentence[]): ITemplate[] {
    const back = sd.makeMarkdown(h("div", [
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
        {name: "SE", front: sd.makeMarkdown(h("h4", v.simplified).outerHTML), back, entry: v.simplified},
        {name: "EC", front: sd.makeMarkdown(h("h4", v.english).outerHTML), back, entry: v.simplified}
    ];
}
