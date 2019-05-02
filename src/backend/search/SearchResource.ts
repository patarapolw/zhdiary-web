import Database from "../db";
import { ObjectID } from "bson";
import QueryParser from "./QueryParser";
import { AggregationCursor } from "mongodb";

export class SearchResource {
    public parser: QueryParser;
    
    private db: Database;

    constructor() {
        this.db = new Database();

        this.parser = new QueryParser({
            anyOf: ["template", "entry", "front", "back", "note"],
            isString: ["template", "entry", "front", "back", "note"],
            isDate: ["nextReview"]
        });
    }

    public getMongoQuery(userId: ObjectID, cond: any, options: any[], isUser: boolean = false): AggregationCursor<any> {
        if (typeof cond === "string") {
            cond = this.parser.parse(cond);
        }

        return this.db.token.aggregate<any>([
            {$lookup: {
                from: "card",
                localField: "entry",
                foreignField: "entry",
                as: "c"
            }},
            {$unwind: {
                path: "$c",
                preserveNullAndEmptyArrays: !isUser
            }},
            {$match: isUser ? {userId} : {$or: [{userId}, {userId: {$exists: false}}]}},
            {$project: {
                entry: 1,
                sub: 1,
                sup: 1,
                var: 1,
                frequency: 1,
                vocabLevel: 1,
                hanziLevel: 1,
                tag: {$concatArrays: [{$ifNull: ["$tag", []]}, {$ifNull: ["$c.tag", []]}]},
                simplified: 1,
                traditional: 1,
                pinyin: 1,
                english: 1,
                cardId: {$toString: "$c._id"},
                front: "$c.front",
                back: "$c.back",
                mnemonic: "$c.mnemonic",
                srsLevel: "$c.srsLevel",
                nextReview: "$c.nextReview",
                created: "$c.created",
                modified: "$c.modified"
            }},
            {$match: cond},
            ...options
        ]);
    }
}

export default SearchResource;
