// import dotenv from "dotenv";
// import Database, { mongoClient } from "../backend/db";
// import ZhLokiDb, { IDbDataToken, IDbDataVocab } from "../backend/zh";
// dotenv.config();

// (async () => {
//     await mongoClient.connect();
//     const zh = await ZhLokiDb.connect();
//     const db = new Database();

//     await db.sentence.insertMany(zh.sentence.find().map((e) => {
//         delete e.$loki;
//         delete e.meta;
//         return e;
//     }))

//     await db.token.insertMany(zh.token.eqJoin(zh.vocab, "name", "simplified",
//     (l: IDbDataToken, r: IDbDataVocab) => {
//         const {name, sup, sub, frequency, hanziLevel, vocabLevel, tag} = l;
//         const {simplified, traditional, pinyin, english} = r;
//         return {
//             entry: name,
//             sup, sub, variant: l.var,
//             freq: frequency,
//             vLevel: vocabLevel,
//             hLevel: hanziLevel,
//             simplified, traditional, pinyin, english,
//             tag
//         }
//     }).data().map((e) => {
//         delete e.$loki;
//         delete e.meta;
//         return e;
//     }));

//     zh.close();
//     mongoClient.close();
// })()
