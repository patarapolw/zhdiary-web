import Database, { mongoClient } from "../server/db";

(async () => {
    await mongoClient.connect();

    const db = new Database();
    db.sentence.createIndex({chinese: 1}, {unique: true});
    db.token.createIndex({entry: 1}, {unique: true});
    db.deck.createIndex({name: 1, userId: 1}, {unique: true});
    db.card.createIndex({front: 1, userId: 1}, {unique: true});

    mongoClient.close();
})();
