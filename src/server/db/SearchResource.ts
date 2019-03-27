import MongoSearchParser from "./SearchParser";
import Database from ".";
import { ObjectID } from "bson";

export class SearchResource {
    private parser: MongoSearchParser;
    private db: Database;

    constructor(anyOf?: string[]) {
        this.parser = new MongoSearchParser({
            anyOf: anyOf ? anyOf : ["deck", "front", "back", "note", "tag", "vocab", "template"],
            isDate: ["nextReview"]
        });
        this.db = new Database();
    }

    public parse(q?: string): any {
        if (!q) {
            return {};
        }
        return this.parser.search(q);
    }

    public getQuery(userId: ObjectID, cond: any) {
        return this.db.card.aggregate([
            {$match: { userId }},
            {$lookup: {
                    from: "deck",
                    localField: "deckId",
                    foreignField: "_id",
                    as: "d"
            }},
            {$unwind: "$d"},
            {$project: {
                vocab: { $arrayElemAt: [{ $split: ["$template", "/"] }, 1] },
                deck: "$d.name",
                front: 1,
                back: 1,
                note: 1,
                tag: 1,
                srsLevel: 1,
                nextReview: 1
            }},
            {$lookup: {
                from: "token",
                localField: "vocab",
                foreignField: "entry",
                as: "t"
            }},
            {$unwind: {
                path: "$t",
                preserveNullAndEmptyArrays: true
            }},
            {$project: {
                vocab: 1,
                deck: 1,
                front: 1,
                back: 1,
                note: 1,
                tag: 1,
                srsLevel: 1,
                nextReview: 1,
                cLevel: { $max: "$t.level.hanzi" },
                cLevels: "$t.level.hanzi",
                vLevel: "$t.level.vocab"
            }},
            { $match: cond }
        ]);
    }
}

export default SearchResource;
