import { Router } from "express";
import asyncHandler from "express-async-handler";
import Database, { ICard } from "../../db";
import { ObjectID } from "bson";
import moment from "moment";
import { md2html } from "../../util";

const router = Router();

router.post("/card",  asyncHandler(async (req, res) => {
    const userId = new ObjectID((req as any).payload.id);
    const db = new Database();

    const fromMarkdown = req.body.fromMarkdown;
    let decks: string[] = req.body.data.map((c: any) => {
        const {deck} = c;
        return deck;
    });

    decks = decks.filter((d, i) => decks.indexOf(d) === i);
    const deckIds = (await Promise.all(decks.map((d) => {
        return db.deck.findOneAndUpdate(
            {userId, name: d},
            {$set: {userId, name: d}},
            {upsert: true, returnOriginal: false});
    }))).map((d) => d.value!._id!);

    const cards: ICard[] = req.body.data.map((c: any) => {
        const {front, back, note, tag, srsLevel, nextReview, vocab, template, deck} = c;
        return {
            userId,
            front: fromMarkdown ? md2html(front) : front,
            back: fromMarkdown ? md2html(back) : back,
            note: fromMarkdown ? md2html(note) : note,
            tag, srsLevel,
            nextReview: moment(nextReview).toDate(),
            template: template ? template : `v/${vocab}`,
            deckId: deckIds[decks.indexOf(deck)]
        } as ICard;
    });

    await db.card.insertMany(cards);

    return res.sendStatus(201);
}));

export default router;
