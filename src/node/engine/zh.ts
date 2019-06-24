import sqlite from "better-sqlite3";
// @ts-ignore
import pinyinConverter from "chinese-to-pinyin";

export type ZhDataType = "hanzi" | "vocab" | "sentence";

export interface IHanziData {
    id: number;
    entry: string;
    percentile: number;
    tag: string[];
}

export interface IVocabData {
    id: number;
    entry: string;
    frequency: string;
    tag: string[];
}

export interface ISentenceData {
    id: number;
    entry: string;
    frequency: string;
    tag: string[];
}

export interface IHanziTemplate {
    id: number;
    entry: string;
    pinyin: string;
    english?: string;
    sub?: string;
    sup?: string;
    var?: string;
    vocab: IVocabTemplate[];
    sentence: ISentenceTemplate[];
    tag?: string[];
}

export interface IVocabTemplate {
    id?: number;
    simplified: string;
    traditional?: string;
    pinyin: string;
    english?: string;
    sentence?: ISentenceTemplate[];
    tag?: string[];
}

export interface ISentenceTemplate {
    id?: number;
    chinese: string;
    english: string;
    tag?: string[];
}

class Zh {
    public conn: sqlite.Database;

    constructor() {
        this.conn = sqlite("asset/zh.db");
    }

    public getAllData(type: ZhDataType): (IHanziData | IVocabData | ISentenceData)[] {
        if (type === "hanzi") {
            return this.conn.prepare(`
            SELECT id, entry, percentile
            FROM hanzi`).all().map((el) => {
                const tag = this.conn.prepare(`
                SELECT name
                FROM tag
                WHERE id = (
                    SELECT tagId FROM hanziTag WHERE hanziId = @id
                )`).all({id: el.id}).map((t) => t.name);

                return {
                    ...el,
                    tag
                } as IHanziData;
            });
        } else if (type === "sentence") {
            return this.conn.prepare(`
            SELECT id, chinese AS entry, frequency
            FROM sentence`).all().map((el) => {
                const tag = this.conn.prepare(`
                SELECT name
                FROM tag
                WHERE id = (
                    SELECT tagId FROM sentenceTag WHERE sentenceId = ?
                )`).all({id: el.id}).map((t) => t.name);

                return {
                    ...el,
                    tag
                } as ISentenceData;
            });
        } else {
            return this.conn.prepare(`
            SELECT id, simplified AS entry, frequency
            FROM vocab`).all().map((el) => {
                const tag = this.conn.prepare(`
                SELECT name
                FROM tag
                WHERE id = (
                    SELECT tagId FROM vocabTag WHERE vocabId = ?
                )`).all({id: el.id}).map((t) => t.name);

                return {
                    ...el,
                    tag
                } as IVocabData;
            });
        }
    }

    public getTemplateData(entry: string, type: ZhDataType):
    IHanziTemplate | IVocabTemplate | ISentenceTemplate | undefined {
        if (type === "hanzi") {
            let out = this.conn.prepare(`
            SELECT id, entry, pinyin, english, sub, sup, var
            FROM hanzi
            WHERE entry = @entry`).get({entry})

            if (!out) {
                out = {
                    entry,
                    pinyin: pinyinConverter(entry)
                }
            } else {
                out.tag = this.conn.prepare(`
                SELECT name
                FROM tag
                WHERE id = (
                    SELECT tagId FROM hanziTag WHERE hanziId = ?
                )`).all(out.id).map((el) => el.name);
            }

            out.vocab = this.conn.prepare(`
            SELECT simplified, traditional, pinyin, english
            FROM vocab
            WHERE
                simplified LIKE ? OR
                traditional LIKE ?
            ORDER BY frequency
            LIMIT 10
            `).all(`%${entry}%`,`%${entry}%`);

            out.sentence = this.conn.prepare(`
            SELECT chinese, english
            FROM sentence
            WHERE chinese LIKE ?
            ORDER BY frequency
            LIMIT 10
            `).all(`%${entry}%`);

            return out as IHanziTemplate;
        } else if (type === "sentence") {
            let out = this.conn.prepare(`
            SELECT id, chinese, english
            FROM sentence
            WHERE chinese = ?`).get(entry)

            if (out) {
                out.tag = this.conn.prepare(`
                SELECT name
                FROM tag
                WHERE id = (
                    SELECT tagId FROM sentenceTag WHERE sentenceId = ?
                )`).all(out.id).map((el) => el.name);
            }

            return out as ISentenceTemplate | undefined;
        } else {
            let out = this.conn.prepare(`
            SELECT id, simplified, traditional, pinyin, english
            FROM vocab
            WHERE
                simplified = ? OR
                traditional = ?`).get(entry, entry)
            
            if (!out) {
                out = {
                    simplified: entry,
                    pinyin: pinyinConverter(entry)
                }
            } else {
                out.tag = this.conn.prepare(`
                SELECT name
                FROM tag
                WHERE id = (
                    SELECT tagId FROM vocab WHERE vocabId = ?
                )`).all(out.id).map((el) => el.name);
            }

            out.sentence = this.conn.prepare(`
            SELECT chinese, english
            FROM sentence
            WHERE chinese LIKE ?
            ORDER BY frequency
            LIMIT 10
            `).all(`%${entry}%`);

            return out as IVocabTemplate | undefined;
        }
    }
}

export default new Zh();
