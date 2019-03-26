import Database, { mongoClient } from "../server/db";
import { generateSecret } from "../server/util";

(async () => {
    await mongoClient.connect();
    const db = new Database();
    const secret = await generateSecret();
    console.log(secret);
    db.user.insertOne({
        email: "patarapolw@gmail.com",
        secret
    });

    mongoClient.close();
})();
