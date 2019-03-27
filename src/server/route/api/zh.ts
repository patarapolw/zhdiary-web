import { Router } from "express";
import asyncHandler from "express-async-handler";
import Database from "../../db";

const router = Router();

router.post("/sentence", asyncHandler(async (req, res) => {
    const db = new Database();
    await db.sentence.insertMany(req.body.data);
    return res.sendStatus(201);
}));

router.post("/vocab", asyncHandler(async (req, res) => {
    const db = new Database();
    await db.vocab.insertMany(req.body.data);
    return res.sendStatus(201);
}));

router.post("/token", asyncHandler(async (req, res) => {
    const db = new Database();
    await db.token.insertMany(req.body.data);
    return res.sendStatus(201);
}));

export default router;
