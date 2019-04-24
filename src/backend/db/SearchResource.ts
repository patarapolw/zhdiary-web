import Database from "../db";
import { ObjectID } from "bson";
import { AggregationCursor } from "mongodb";
import SearchParser from "./MongoQParser";

export class SearchResource {
    private db: Database;
    private parser: SearchParser;

    constructor(anyOf: string[] = ["template", "entry", "front", "back", "note", "deck"]) {
        this.db = new Database();
        this.parser = new SearchParser({
            anyOf,
            isString: ["template", "entry", "front", "back", "note", "deck"],
            isDate: ["nextReview"],
            isList: ["tag"]
        });
    }

    public parse(q?: string) {
        return this.parser.parse(q);
    }

    public getQuery(userId: ObjectID, cond: any, options: any[], isUser: boolean = true): AggregationCursor<any> {
        return this.db.token.aggregate([
            // {$lookup: {
            //     from: "vocab",
            //     localField: "name",
            //     foreignField: "simplified",
            //     as: "v"
            // }},
            // {$unwind: {
            //     path: "$v",
            //     preserveNullAndEmptyArrays: true
            // }},
            // {$lookup: {
            //     from: "card",
            //     let: {entry: "$name"},
            //     pipeline: [
            //         {$match: {
            //             userId,
            //             entry: "$$name"
            //         }}
            //     ],
            //     as: "c"
            // }},
            // {$unwind: {
            //     path: "$c",
            //     preserveNullAndEmptyArrays: !isUser
            // }},
            // {$lookup: {
            //     from: "deck",
            //     localField: "c.deckId",
            //     foreignField: "_id",
            //     as: "d"
            // }},
            // {$unwind: {
            //     path: "$d",
            //     preserveNullAndEmptyArrays: true
            // }},
            {$project: {
                entry: "$name",
                sub: 1,
                sup: 1,
                var: 1,
                frequency: 1,
                vocabLevel: 1,
                hanziLevel: 1,
                tag: 1,
                // tag: {$concatArrays: ["$tag", "$c.tag"]},
                simplified: "$v.simplified",
                traditional: "$v.traditional",
                pinyin: "$v.pinyin",
                english: "$v.english",
                deck: "$d.deck",
                cardId: "$c._id",
                front: "$c.front",
                back: "$c.back",
                mnemonic: "$c.mnemonic",
                srsLevel: "$c.srsLevel",
                nextReview: 1,
                created: 1,
                modified: 1
            }},
            {$match: cond},
            ...options
        ], {allowDiskUse: true});
    }
}

export default SearchResource;
