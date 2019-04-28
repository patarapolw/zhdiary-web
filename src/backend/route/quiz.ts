import { Request, Response, Router } from "express";
import asyncHandler from "express-async-handler";
import needUserId from "../middleware/needUserId";
import Database from "../db";
import { ObjectID } from "bson";
import QuizResource from "../db/QuizResource";
import moment from "moment";
import SearchResource from "../search/SearchResource";

interface ITreeViewStat {
    new: number;
    leech: number;
    due: number;
    total: number;
}

export interface ITreeViewItem {
    name: string;
    fullName: string;
    isOpen: boolean;
    children?: ITreeViewItem[];
    stat: ITreeViewStat;
}

class QuizController {
    public static async treeview(req: Request, res: Response): Promise<Response> {
        function recurseParseData(data: ITreeViewItem[], deck: string[], _depth = 0) {
            let doLoop = true;

            while (_depth < deck.length - 1) {
                for (const c of data) {
                    if (c.name === deck[_depth]) {
                        c.children = c.children || [];
                        recurseParseData(c.children, deck, _depth + 1);
                        doLoop = false;
                        break;
                    }
                }

                _depth++;

                if (!doLoop) {
                    break;
                }
            }

            if (doLoop && _depth === deck.length - 1) {
                const fullName = deck.join("/");
                // const thisDeckData = deckData.filter((d) => new RegExp(`^${XRegExp.escape(fullName)}`).test(d.deck));
                let thisDeckData: any[] = [];
                if (fullName === "@Pool") {
                    thisDeckData = deckData;
                } else if (/^HSK/.test(fullName)) {
                    const [_, tag] = fullName.split("/");
                    thisDeckData = deckData.filter((d) => d.tag && d.tag.indexOf(tag) !== -1);
                }

                data.push({
                    name: deck[_depth],
                    fullName,
                    isOpen: _depth < 2,
                    stat: {
                        new: thisDeckData.filter((d) => !d.nextReview).length,
                        leech: thisDeckData.filter((d) => d.srsLevel === 0).length,
                        due: thisDeckData.filter((d) => d.nextReview && moment(d.nextReview).toDate() < now).length,
                        total: thisDeckData.length
                    }
                });
            }
        }

        const sr = new SearchResource();

        const userId = res.locals.userId;

        const deckData = await sr.getMongoQuery(userId, req.body.q, [
            {$project: {nextReview: 1, srsLevel: 1, tag: 1}}
        ]).toArray();

        const now = new Date();

        const deckList: string[] = [
            "@Pool",
            "HSK/HSK1",
            "HSK/HSK2",
            "HSK/HSK3",
            "HSK/HSK4",
            "HSK/HSK5",
            "HSK/HSK6"
        ];
        const deckWithSubDecks: string[] = [];

        deckList.filter((d, i) => deckList.indexOf(d) === i).sort().forEach((d) => {
            const deck = d.split("/");
            deck.forEach((seg, i) => {
                const subDeck = deck.slice(0, i + 1).join("/");
                if (deckWithSubDecks.indexOf(subDeck) === -1) {
                    deckWithSubDecks.push(subDeck);
                }
            });
        });

        const fullData = [] as ITreeViewItem[];
        deckWithSubDecks.forEach((d) => {
            const deck = d.split("/");
            recurseParseData(fullData, deck);
        });

        return res.json(fullData);
    }

    public static async build(req: Request, res: Response): Promise<Response> {
        const sr = new SearchResource();
        const cond = sr.parser.parse(req.body.q);
        const andCond = [cond];
        
        if (req.body.deck) {
            const deckName = req.body.deck;

            if (/^HSK/.test(deckName)) {
                const [_, tag] = deckName.split("/");
                andCond.push({tag})
            }
        }

        const userId = res.locals.userId;

        if (req.body.due) {
            const d: any[] = req.body.due;
            andCond.push({nextReview: {$lt: moment().add(d[0], d[1]).toDate()}});
        } else {
            andCond.push({$or: [
                {nextReview: {$exists: false}},
                {nextReview: {$in: [null, ""]}},
                {nextReview: {$lt: new Date()}}
            ]});
        }

        const cards = await sr.getMongoQuery(userId, {$and: andCond}, [
            {$project: {id: 1, entry: 1}}
        ]).toArray();

        return res.json(cards);
    }

    public static async render(req: Request, res: Response): Promise<Response> {
        const db = new Database();

        let _id: ObjectID;
        if (req.body.id) {
            _id = new ObjectID(req.body.id);
        } else {
            const entry: string = req.body.entry;
            const userId = res.locals.userId;

            _id = (await db.create(userId, entry))[0];
        }

        const card = (await db.card.find({_id}).project({
            front: 1, back: 1,
            template: 1, note: 1
        }).limit(1).toArray())[0];

        return res.json(card);
    }

    public static right(req: Request, res: Response): Response {
        const db = new Database();
        const _id = new ObjectID(req.body.id);

        db.card.find({_id}).limit(1).forEach((c) => {
            c.srsLevel = (c.srsLevel || 0) + 1;
            if (c.srsLevel >= QuizResource.srsMap.length) {
                c.srsLevel = QuizResource.srsMap.length - 1;
            }
            c.nextReview = QuizResource.getNextReview(c.srsLevel);
            db.card.updateOne({_id}, {$set: {
                srsLevel: c.srsLevel,
                nextReview: c.nextReview,
                modified: new Date()
            }});
        });

        return res.sendStatus(201);
    }

    public static wrong(req: Request, res: Response): Response {
        const db = new Database();
        const _id = new ObjectID(req.body.id);

        db.card.find({_id}).limit(1).forEach((c) => {
            c.srsLevel = (c.srsLevel || 0) - 1;
            if (c.srsLevel < 0) {
                c.srsLevel = 0;
            }
            c.nextReview = QuizResource.repeat();
            db.card.updateOne({_id}, {$set: {
                srsLevel: c.srsLevel,
                nextReview: c.nextReview,
                modified: new Date()
            }});
        });

        return res.sendStatus(201);
    }
}

const router = Router();
router.use(needUserId());

router.post("/", asyncHandler(QuizController.build));
router.post("/treeview", asyncHandler(QuizController.treeview));
router.post("/render", asyncHandler(QuizController.render));
router.put("/right", QuizController.right);
router.put("/wrong", QuizController.wrong);

export default router;
