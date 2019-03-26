import Database, { mongoClient } from "../server/db";
import cLevelJson from "./cLevel.json";

(async () => {
    await mongoClient.connect();

    const db = new Database();
    const tokens = await db.token.find().toArray();
    const bulk = db.token.initializeUnorderedBulkOp();
    tokens.forEach((t) => {
        const cLevel = t.level ? t.level.hanzi || null : null;
        if (cLevel instanceof Array) {} else if (typeof cLevel === "number") {
            return bulk.find({entry: t.entry}).updateOne({$set: {"level.hanzi": [cLevel]}});
        } else {
            const cLevels = [] as number[];
            t.entry.split("").forEach((c) => {
                for (const lv of Object.keys(cLevelJson)) {
                    if ((cLevelJson as any)[lv].indexOf(c) !== -1) {
                        cLevels.push(parseInt(lv));
                        break;
                    }
                }
            });

            if (cLevels.length > 0) {
                return bulk.find({entry: t.entry}).updateOne({$set: {"level.hanzi": cLevels}});
            }
        }
        return;
    });

    await bulk.execute();

    mongoClient.close();
})();
