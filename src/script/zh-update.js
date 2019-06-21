import sqlite from "better-sqlite3";

(async () => {
    const zh = sqlite("asset/zh.db");

    for (const c of zh.prepare("SELECT id, tag FROM vocab WHERE tag IS NOT NULL").all()) {
        for (const tag of c.tag.split("\x1f")) {
            try {
                zh.prepare(`
                INSERT INTO tag (name)
                VALUES (@tag)
                `).run({tag})
                zh.prepare("COMMIT").run();
            } catch (e) {}

            try {
                zh.prepare(`
                INSERT INTO vocabTag (vocabId, tagId)
                VALUES (
                    @id,
                    (SELECT id FROM tag WHERE name = @tag)
                )
                `).run({id: c.id, tag})
            } catch (e) {}
        }
    }

    zh.close();
})();
