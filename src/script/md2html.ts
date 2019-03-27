import Database, { mongoClient } from "../server/db";
import { md2html } from "../server/util";

(async () => {
    await mongoClient.connect();

    const db = new Database();
    const cards = await db.card.find().project({_id: 1, front: 1, back: 1, note: 1}).toArray();

    const bulk = db.card.initializeUnorderedBulkOp();
    cards.forEach((c) => {
        bulk.find({_id: c._id}).updateOne({
            front: md2html(c.front),
            back: md2html(c.back),
            note: md2html(c.note)
        });
    });
    await bulk.execute();

    mongoClient.close();
})();
