const s = `
export interface IDbCard {
    _id?: ObjectID;
    userId: ObjectID;
    deckId: ObjectID;
    template?: ITemplate;
    note?: INote;
    sourceId?: ObjectID;
    front: string;
    back?: string;
    mnemonic?: string;
    srsLevel?: number;
    nextReview?: Date;
    tag?: string[];
    created?: Date;
    modified?: Date;
}
`;

console.log(JSON.stringify(s.split("\n").map((a) => /(\w+)\??:/.exec(a)).filter((a) => a).map((a) => a![1])));
