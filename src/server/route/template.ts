import { Request, Response, Router } from "express";
import asyncHandler from "express-async-handler";
import needUserId from "../middleware/needUserId";
import TemplateResource, { ITemplate } from "../db/TemplateResource";

export class TemplateController {
    public static async get(req: Request, res: Response): Promise<Response> {
        const templateName: string = req.body.template;
        const template: ITemplate | null = await TemplateResource.get(templateName);

        return res.json(template);
    }
}

export const router = Router();
router.use(needUserId());

router.post("/", asyncHandler(TemplateController.get));

export default router;
