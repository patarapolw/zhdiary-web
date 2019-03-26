import { MongoClient, Db, Collection, ObjectID } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

export const mongoClient = new MongoClient(process.env.MONGO_URI!, { useNewUrlParser: true });

export interface IUser {
    _id?: ObjectID;
    email: string;
    secret: string;
}

export interface ICard {
    _id?: ObjectID;
    userId: ObjectID;
    deckId: ObjectID;
    template?: string;
    front: string;
    back?: string;
    note?: string;
    tag?: string[];
    srsLevel: number;
    nextReview: Date;
}

export interface IDeck {
    _id?: ObjectID;
    userId: ObjectID;
    name: string;
}

export interface ISentence {
    chinese: string;
    english: string;
    source?: "tatoeba" | "jukuu";
    contributor?: string;
}

export interface IToken {
    entry: string;
    frequency?: number;
    sub?: string[];
    super?: string[];
    variant?: string[];
    tag?: string[];
    level?: ILevel;
}

export interface IVocab {
    simplified: string;
    traditional?: string;
    pinyin: string;
    english?: string;
}

export interface ILevel {
    hanzi?: number[];
    vocab?: number;
}

export class Database {
    public user: Collection<IUser>;
    public card: Collection<ICard>;
    public deck: Collection<IDeck>;

    public sentence: Collection<ISentence>;
    public token: Collection<IToken>;
    public vocab: Collection<IVocab>;

    private db: Db;

    constructor() {
        this.db = mongoClient.db("zhdiary");

        this.user = this.db.collection("user");
        this.card = this.db.collection("card");
        this.deck = this.db.collection("deck");

        this.sentence = this.db.collection("sentence");
        this.token = this.db.collection("token");
        this.vocab = this.db.collection("vocab");
    }
}

export default Database;
