import { MongoClient, Db, Collection, ObjectID } from "mongodb";
import zh, { ZhDataType } from "./zh";
import { sorter, mongoToFilter } from "./search";
import assert from "assert";
import { srsMap, getNextReview, repeatReview } from "./quiz";
import dotenv from "dotenv";
dotenv.config();

export const mongoClient = new MongoClient(process.env.MONGO_URI!, { useNewUrlParser: true });

export interface IDbUser {
    _id?: ObjectID;
    email: string;
    secret: string;
    picture: string;
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

interface ICondOptions {
    offset?: number;
    limit?: number;
    sortBy?: string;
    desc?: boolean;
    fields?: string[];
}

interface IPagedOutput<T> {
    data: T[];
    count: number;
}

export class Database {
    public user: Collection<IDbUser>;
    public card: Collection<IDbCard>;

    private db: Db;

    constructor() {
        this.db = mongoClient.db("data");

        this.user = this.db.collection("user");
        this.card = this.db.collection("card");
    }

    public async build() {
        try {
            return await Promise.all([
                this.user.createIndex({email: 1}, {unique: true}),
                this.card.createIndex({userId: 1, front: 1}, {unique: true}),
                this.card.createIndex({entry: "text"})
            ]);
        } catch (e) {}

        return;
    }

    public async downloadAll() {
        return await this.card.find().project({_id: 0}).toArray();
    }

    public async parseCond(
        userId: ObjectID,
        mongoCond: {[k: string]: any}, 
        options: ICondOptions = {}
    ): Promise<IPagedOutput<any>> {
        if (!options.fields) {
            return {
                data: [],
                count: 0
            };
        }

        const requiredFields = new Set(options.fields);
        const proj = {
            entry: 1,
            _id: 1
        } as {[k: string]: 1 | -1};

        for (const k of requiredFields) {
            proj[k] = 1;
        }

        const allData = {} as any;
        let extra = [] as any[];

        if (mongoCond.data) {
            const sqlCond = mongoCond.data;
            const type = mongoCond.type;

            delete mongoCond.data;
            delete mongoCond.type;

            for (const c of await this.card.find().project(proj).toArray()) {
                allData[c.entry] = {
                    ...c,
                    data: zh.getTemplateData(c.entry, type)
                }
            }

            for (const c of zh.getAllData(type)) {
                if (!Object.keys(allData).includes(c.entry)) {
                    allData[c.entry] = c;
                }
            }

            const allItems = Object.values(allData).filter(mongoToFilter(sqlCond)) as any[];

            if (options.sortBy && options.sortBy[0] === "@") {
                return {
                    data: allItems.sort(sorter(options.sortBy.substr(1) || "_id", options.desc))
                    .slice(options.offset || 0, options.limit ? ((options.offset || 0) + options.limit) : undefined),
                    count: allItems.length
                };
            } else {
                extra = allItems.filter((c) => !c._id);
                mongoCond = {_id: {$in: allItems.filter((c) => c._id)}}
            }
        }

        let q = this.card.find({userId}).project(proj);
        let mongoCount = await q.clone().count();
        let output = [] as any[];

        if (options.offset && options.offset > mongoCount) {
            options.offset -= mongoCount;
            output = extra.slice(options.offset, options.limit ? options.offset + options.limit : undefined);
        } else {
            if (options.sortBy && options.sortBy[0] !== "@") {
                q = q.sort(options.sortBy);
            }
    
            q = q.skip(options.offset || 0);
    
            if (options.limit) {
                q = q.limit(options.limit);
            }
    
            for (const c of await q.toArray()) {
                output.push({
                    ...c,
                    data: allData[c.entry]
                });
            }
    
            output.push(...extra);
            output = output.slice(0, options.limit);
        }

        return {
            data: output.map((c) => {
                for (const k of Object.keys(c)) {
                    if (!requiredFields.has(k)) {
                        delete c[k];
                    }
                }
                return c;
            }),
            count: mongoCount + extra.length
        };
    }

    public async insertMany(userId: ObjectID, c: {[k: string]: any}[]): Promise<string[]> {
        const created = new Date();

        return Object.values((await this.card.insertMany(c.map((c0) => {
            const {entry, front} = c0;
            assert(entry);
            assert(front);

            return {
                ...c0,
                userId,
                entry,
                front,
                created
            }
        }))).insertedIds).map((k) => k.toHexString());
    }

    public async updateMany(ids: string[], u: any) {
        return (await this.card.updateMany({_id: {$in: ids.map((id) => new ObjectID(id))}}, {
            $set: {
                modified: new Date(),
                ...u
            }
        })).result;
    }

    public async addTags(ids: string[], tags: string[]) {
        return (await this.card.updateMany({_id: {$in: ids.map((id) => new ObjectID(id))}}, {
            $set: {modified: new Date()},
            $addToSet: {tag: {$each: tags}}
        })).result;
    }

    public async removeTags(ids: string[], tags: string[]) {
        return (await this.card.updateMany({_id: {$in: ids.map((id) => new ObjectID(id))}}, {
            $set: {modified: new Date()},
            $pull: {tag: {$in: tags}}
        })).result;
    }

    public async deleteMany(ids: string[]) {
        return (await this.card.deleteMany({_id: {$in: ids.map((id) => new ObjectID(id))}})).result;
    }

    public render(entry: string, type: ZhDataType): any {
        return {data: zh.getTemplateData(entry, type)}
    }

    public async renderFromId(userId: ObjectID, cardId: string): Promise<any> {
        const c = await this.parseCond(userId, {_id: new ObjectID(cardId)}, {
            limit: 1,
            fields: ["front", "back"]
        });

        return c.data[0];
    }

    public async markRight(userId: ObjectID, cardId?: string, cardData?: {[k: string]: any}): Promise<string | null> {
        return await this.createAndUpdateCard(+1, userId, cardId, cardData);
    }

    public async markWrong(userId: ObjectID, cardId?: string, cardData?: {[k: string]: any}): Promise<string | null> {
        return await this.createAndUpdateCard(-1, userId, cardId, cardData);
    }

    private async createAndUpdateCard(dSrsLevel: number, userId: ObjectID,
            cardId?: string, card?: {[k: string]: any}): Promise<string | null> {
        if (cardId) {
            card = await this.card.findOne({_id: new ObjectID(cardId)}) || undefined;
        }

        if (!card) {
            return null;
        }

        card.srsLevel = card.srsLevel || 0;
        card.streak = card.streak || {
            right: 0,
            wrong: 0
        };

        if (dSrsLevel > 0) {
            card.streak.right++;
        } else if (dSrsLevel < 0) {
            card.streak.wrong--;
        }

        card.srsLevel += dSrsLevel;

        if (card.srsLevel >= srsMap.length) {
            card.srsLevel = srsMap.length - 1;
        }

        if (card.srsLevel < 0) {
            card.srsLevel = 0;
        }

        if (dSrsLevel > 0) {
            card.nextReview = getNextReview(card.srsLevel);
        } else {
            card.nextReview = repeatReview();
        }

        if (!cardId) {
            cardId = (await this.insertMany(userId, [card]))[0];
        } else {
            const {srsLevel, streak, nextReview} = card;
            await this.updateMany([cardId], {srsLevel, streak, nextReview});
        }

        return cardId!;
    }
}

export default Database;