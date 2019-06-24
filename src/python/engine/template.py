import pinyin
from typing import Iterable

from ..ext import zh


def get_template_data(entry: str, type_: str) -> dict:
    if type_ == "hanzi":
        h = [dict(h0) for h0 in zh.execute("""
        SELECT id, entry, pinyin, english, sub, sup, var
        FROM hanzi
        WHERE entry = ?
        """, (entry,))]

        tags = []

        if len(h) == 0:
            h = [{
                "entry": entry,
                "pinyin": pinyin.get(entry, delimiter=" ", format="numerical")
            }]
        else:
            tags = [t[0] for t in zh.execute("""
            SELECT name
            FROM tag
            WHERE id = (
                SELECT tagId FROM hanziTag WHERE hanziId IN ({})
            )
            """.format(",".join(["?" * len(h)])), [h0["id"] for h0 in h])]

        h = h[0]

        c = [dict(c0) for c0 in zh.execute("""
        SELECT simplified, traditional, pinyin, english
        FROM vocab
        WHERE
            simplified LIKE ? OR
            traditional LIKE ?
        """, ("%{}%".format(entry), "%{}%".format(entry)))]

        sentences = [dict(s0) for s0 in zh.execute("""
        SELECT chinese, english
        FROM sentence
        WHERE chinese LIKE ?
        ORDER BY frequency
        LIMIT 10
        """, ("%{}%".format(entry)))]

        data = {
            "h": h,
            "v": c,
            "s": sentences,
            "tag": tags
        }
    elif type_ == "sentence":
        sentences = [dict(s0) for s0 in zh.execute("""
        SELECT id, chinese, english
        FROM sentence
        WHERE chinese = ?
        """, (entry,))]

        tags = []

        if len(sentences) > 0:
            tags = [t[0] for t in zh.execute("""
            SELECT name
            FROM tag
            WHERE id = (
                SELECT tagId FROM sentenceTag WHERE sentenceId IN ({})
            )
            """.format(",".join(["?" * len(sentences)])), [s0["id"] for s0 in sentences])]

        data = {
            "s": sentences,
            "tag": tags
        }
    else:
        c = [dict(c0) for c0 in zh.execute("""
        SELECT id, simplified, traditional, pinyin, english
        FROM vocab
        WHERE
            simplified = ? OR
            traditional = ?
        """, (entry, entry))]

        tags = []

        if len(c) == 0:
            c.append({
                "simplified": entry,
                "pinyin": pinyin.get(entry, delimiter=" ", format="numerical")
            })
        else:
            tags = [t[0] for t in zh.execute("""
            SELECT name
            FROM tag
            WHERE id = (
                SELECT tagId FROM vocabTag WHERE vocabId IN ({})
            )
            """.format(",".join(["?" * len(c)])), [c0["id"] for c0 in c])]

        sentences = [dict(s0) for s0 in zh.execute("""
        SELECT chinese, english
        FROM sentence
        WHERE chinese LIKE ?
        ORDER BY frequency
        LIMIT 10
        """, ("%{}%".format(entry)))]

        data = {
            "v": c,
            "s": sentences,
            "tag": tags
        }

    return data


def get_all_data(type_: str) -> Iterable[dict]:
    if type_ == "hanzi":
        for h in zh.execute("""
        SELECT id, entry, percentile
        FROM hanzi
        """):
            tags = [t[0] for t in zh.execute("""
            SELECT name
            FROM tag
            WHERE id = (
                SELECT tagId FROM hanziTag WHERE hanziId = ?
            )
            """, (h["id"],))]

            yield {
                "entry": h["entry"],
                "type": type_,
                "h": h,
                "tag": tags
            }
    elif type_ == "sentence":
        for s in zh.execute("""
        SELECT id, chinese, frequency
        FROM sentence
        """):
            tags = [t[0] for t in zh.execute("""
            SELECT name
            FROM tag
            WHERE id = (
                SELECT tagId FROM sentenceTag WHERE sentenceId = ?
            )
            """, (s["id"],))]

            yield {
                "entry": s["chinese"],
                "type": type_,
                "s": s,
                "tag": tags
            }
    else:
        for v in zh.execute("""
        SELECT id, simplified, frequency
        FROM vocab
        """):
            tags = [t[0] for t in zh.execute("""
            SELECT name
            FROM tag
            WHERE id = (
                SELECT tagId FROM vocabTag WHERE vocabId = ?
            )
            """, (v["id"],))]

            yield {
                "entry": v["simplified"],
                "type": type_,
                "v": v,
                "tag": tags
            }
