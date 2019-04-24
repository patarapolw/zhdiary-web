import { MongoClient, Db, Collection, ObjectID } from "mongodb";
import dotenv from "dotenv";
import moment from "moment";
import crypto from "crypto";
import { getOnlineSentence } from "../zh/juuku";
import { ITemplate, getTemplateFromData } from "../zh/template";
dotenv.config();

export const mongoClient = new MongoClient(process.env.MONGO_URI!, { useNewUrlParser: true });

export interface IDbUser {
    _id?: ObjectID;
    email: string;
    secret: string;
    permission?: any;
}

export interface IDbCard {
    _id?: ObjectID;
    userId: ObjectID;
    deckId?: ObjectID;
    entry: string;
    template?: string;
    front: string;
    back?: string;
    mnemonic?: string;
    srsLevel?: number;
    nextReview?: Date;
    tag?: string[];
    created: Date;
    modified?: Date;
}

export interface IDbDeck {
    _id?: ObjectID;
    userId: ObjectID;
    name: string;
    isOpen?: boolean;
}

export interface IDbDataSentence {
    _id?: ObjectID;
    chinese: string;
    english: string;
}

export interface IDbDataToken {
    _id?: ObjectID;
    name: string;
    sup?: string[];
    sub?: string[];
    var?: string[];
    frequency?: number;
    vocabLevel?: number;
    hanziLevel?: number;
    tag?: string[];
}

export interface IDbDataVocab {
    _id?: ObjectID;
    simplified: string;
    traditional?: string;
    pinyin: string;
    english: string;
}

export interface IEntry {
    _id?: ObjectID;
    entry: string;
    template?: string;
    deck: string;
    front: string;
    back?: string;
    mnemonic?: string;
    srsLevel?: number;
    nextReview?: Date;
    tag?: string[];
    created?: Date;
    modified?: Date;
}

export class Database {
    public user: Collection<IDbUser>;
    public card: Collection<IDbCard>;
    public deck: Collection<IDbDeck>;

    public sentence: Collection<IDbDataSentence>;
    public token: Collection<IDbDataToken>;
    public vocab: Collection<IDbDataVocab>;

    // private userDb: Db;
    // private dataDb: Db;
    private db: Db;

    constructor() {
        this.db = mongoClient.db("data");

        this.user = this.db.collection("user");
        this.card = this.db.collection("card");
        this.deck = this.db.collection("deck");

        // this.dataDb = mongoClient.db("data");

        this.sentence = this.db.collection("sentence");
        this.token = this.db.collection("token");
        this.vocab = this.db.collection("vocab");
    }

    public async build() {
        try {
            const secret = await new Promise((resolve, reject) => {
                crypto.randomBytes(48, (err, b) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(b.toString("base64"));
                });
            }) as string;

            if (process.env.DEFAULT_USER) {
                await this.user.insertOne({email: process.env.DEFAULT_USER!, secret});
            }

            return await Promise.all([
                this.user.createIndex({email: 1}, {unique: true}),
                this.deck.createIndex({userId: 1, name: 1}, {unique: true}),
                this.card.createIndex({userId: 1, front: 1}, {unique: true}),
                this.card.createIndex({entry: "text"})
            ]);
        } catch (e) {}

        return;
    }

    public async create(userId: ObjectID, vocabs: string[]): Promise<ObjectID[]> {
        const entries = await this.vocab.find({$or: [
            {simplified: {$in: vocabs}},
            {traditional: {$in: vocabs}}
        ]}).toArray();

        const sentences = await Promise.all(entries.map((e) => {
            return this.sentence.find({chinese: {$regex: e.simplified}}).toArray();
        }));

        const extras = await Promise.all(sentences.map((s, i) => {
            if (s.length < 10) {
                return getOnlineSentence(entries[i].simplified);
            } else {
                return [];
            }
        }));

        const ts: ITemplate[] = entries.map((e, i) => {
            return getTemplateFromData(e, [...sentences[i], ...extras[i]]);
        }).reduce((a, b) => [...a, ...b]);

        const now = new Date();

        return Object.values((await this.card.insertMany(ts.map((t) => {
            return {
                userId,
                front: t.front,
                back: t.back,
                entry: t.entry,
                template: t.name,
                created: now
            };
        }))).insertedIds);
    }

    public async update(userId: ObjectID, u: Partial<IEntry>) {
        const c = await this.transformUpdate(userId, u);
        c.modified = new Date();
        return await this.card.updateOne({_id: u._id}, {$set: c});
    }

    private async transformUpdate(userId: ObjectID, u: Partial<IEntry>): Promise<Partial<IDbCard>> {
        const output: Partial<IDbCard> = {};

        for (const k of Object.keys(u)) {
            const v = (u as any)[k];

            if (k === "deck") {
                const r = await this.deck.findOneAndUpdate(
                    {userId, name: v},
                    {
                        $set: {userId, name: v}
                    },
                    {returnOriginal: false, upsert: true}
                );
                delete (u as any)[k];
                output.deckId = r.value!._id;
            } else if (["nextReview", "created", "modified"].indexOf(k) !== -1) {
                output.nextReview = moment(v).toDate();
            } else {
                (output as any)[k] = v;
            }
        }

        return output;
    }
}

export default Database;
