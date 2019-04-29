import { MongoClient, Db, Collection, ObjectID } from "mongodb";
import dotenv from "dotenv";
import moment from "moment";
import crypto from "crypto";
import { getOnlineSentence } from "../zh/juuku";
import { ITemplate, getTemplateFromData } from "../zh/template";
import XRegexp from "xregexp";
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

export interface IDbDataToken {
    _id?: ObjectID;
    entry: string;
    sup?: string[];
    sub?: string[];
    variant?: string[];
    freq?: number;
    vLevel?: number;
    hLevel?: number[];
    simplified?: string;
    traditional?: string;
    pinyin?: string;
    english?: string;
    tag?: string[];
}

export interface IDbDataSentence {
    _id?: ObjectID;
    chinese: string;
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
    
    public token: Collection<IDbDataToken>;
    public sentence: Collection<IDbDataSentence>;

    private db: Db;

    constructor() {
        this.db = mongoClient.db("data");

        this.user = this.db.collection("user");
        this.card = this.db.collection("card");
        this.token = this.db.collection("token");
        this.sentence = this.db.collection("sentence");
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
                this.card.createIndex({userId: 1, front: 1}, {unique: true}),
                this.card.createIndex({entry: "text"})
            ]);
        } catch (e) {}

        return;
    }

    public async create(userId: ObjectID, vocab: string): Promise<ObjectID[]> {
        const entries = await this.token.find({$or: [
            {simplified: vocab},
            {traditional: vocab}
        ]}).toArray();

        const sentences = await Promise.all(entries.map((e) => {
            return this.sentence.find({chinese: {$regex: XRegexp.escape(e.simplified!)}}).limit(10).toArray();
        }));

        const extras = await Promise.all(sentences.map((s, i) => {
            if (s.length < 10) {
                return getOnlineSentence(entries[i].simplified!);
            } else {
                return [];
            }
        }));

        const ts: ITemplate[] = entries.map((e, i) => {
            return getTemplateFromData(e, [...sentences[i], ...extras[i]]);
        }).reduce((a, b) => [...a, ...b]);

        const now = new Date();

        const ids = Object.values((await this.card.insertMany(ts.map((t) => {
            return {
                userId,
                front: t.front,
                back: t.back,
                entry: t.entry,
                template: t.name,
                created: now
            };
        }))).insertedIds);

        return ids;
    }

    public async update(u: Partial<IEntry>) {
        const c = await this.transformUpdate(u);
        c.modified = new Date();
        return await this.card.updateOne({_id: u._id}, {$set: c});
    }

    private async transformUpdate(u: Partial<IEntry>): Promise<Partial<IDbCard>> {
        const output: Partial<IDbCard> = {};

        for (const k of Object.keys(u)) {
            const v = (u as any)[k];

            if (["nextReview", "created", "modified"].indexOf(k) !== -1) {
                output.nextReview = moment(v).toDate();
            } else {
                (output as any)[k] = v;
            }
        }

        return output;
    }
}

export default Database;
