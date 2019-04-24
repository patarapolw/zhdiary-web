import { Request, Response, Router } from "express";
import XRegExp from "xregexp";
import asyncHandler from "express-async-handler";
import needUserId from "../middleware/needUserId";
import Database from "../db";
import { ObjectID } from "bson";
import QuizResource from "../db/QuizResource";
import SearchResource from "../db/SearchResource";

class QuizController {
    public static async build(req: Request, res: Response): Promise<Response> {
        const search = new SearchResource();
        let cond = search.parse(req.body.q);

        if (req.body.deck) {
            cond.deck = {$regex: `${XRegExp.escape(req.body.deck)}(/.+)?`};
        }

        cond = {$and: [
            cond,
            {$or: [
                {nextReview: {$exists: false}},
                {nextReview: {$in: [null, ""]}},
                {nextReview: {$lt: new Date()}}
            ]}
        ]};

        const cards = await search.getQuery(res.locals.userId, cond, [
            {$project: {id: {$toString: "$cardId"}, entry: 1}}
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

            _id = (await db.create(userId, [entry]))[0];
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
router.post("/render", asyncHandler(QuizController.render));
router.put("/right", QuizController.right);
router.put("/wrong", QuizController.wrong);

export default router;
