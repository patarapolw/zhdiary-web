import { Request, Response, Router } from "express";
import Database from "../../db";
import { ObjectID } from "bson";
import asyncHandler from "express-async-handler";
import SearchResource from "../../search/SearchResource";

class EditorController {
    public static async find(req: Request, res: Response): Promise<Response> {
        const sr = new SearchResource();

        const userId = res.locals.userId;

        const offset: number = req.body.offset;
        const limit: number = req.body.limit;
        const sortBy: string = req.body.sortBy || "deck";
        const desc: boolean = req.body.desc || false;

        const q = await sr.getMongoQuery(userId, req.body.q, [
            {$facet: {
                data: [
                    {$sort: {[sortBy]: desc ? -1 : 1}},
                    {$skip: offset},
                    {$limit: limit}
                ],
                count: [{$group: {
                    _id: null,
                    count: {$sum: 1}
                }}]
            }}
        ], true).toArray();

        return res.json({
            data: q[0].data,
            count: q[0].count[0] ? q[0].count[0].count : 0
        });
    }

    public static async findOne(req: Request, res: Response): Promise<Response> {
        const rSearch = new SearchResource();
        const cond = {id: req.body.id};
        const userId = res.locals.userId;

        const q = await rSearch.getMongoQuery(userId, cond, [
            {$limit: 1}
        ]).toArray();
        const c: any = q[0];
        return res.json(c);
    }

    public static async create(req: Request, res: Response): Promise<Response> {
        const db = new Database();
        const userId = res.locals.userId;
        const vocab: string = req.body.create;
        const _id = (await db.create(userId, vocab))[0];

        return res.json({id: _id.toHexString()});
    }

    public static async update(req: Request, res: Response): Promise<Response> {
        if (req.body.create) {
            return EditorController.create(req, res);
        }

        const db = new Database();
        const userId = res.locals.userId;
        const id: string = req.body.id;

        if (req.body.update) {
            const u = req.body.update;
            await db.update({
                _id: new ObjectID(id),
                ...u
            });
        } else {
            const fieldName: string = req.body.fieldName;
            const fieldData: any = req.body.fieldData;
            await db.update({
                _id: new ObjectID(id),
                [fieldName]: fieldData
            });
        }

        return res.sendStatus(201);
    }

    public static async delete(req: Request, res: Response): Promise<Response> {
        const id: string = req.body.id;
        const db = new Database();
        await db.card.deleteOne({_id: new ObjectID(id)});

        return res.sendStatus(201);
    }
}

export const router = Router();

router.post("/", asyncHandler(EditorController.find));
router.post("/findOne", asyncHandler(EditorController.findOne));
router.post("/create", asyncHandler(EditorController.create));
router.put("/", asyncHandler(EditorController.update));
router.delete("/", asyncHandler(EditorController.delete));

export default router;
