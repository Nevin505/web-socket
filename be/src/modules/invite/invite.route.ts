import { Router } from "express";
import { generateInviteCode, redemInviteCode } from "./invite.controller";
import { auth } from "../../middleware/auth";

const inviteRouter = Router();

inviteRouter.post("/generate", auth, generateInviteCode);
inviteRouter.post("/redem", auth, redemInviteCode);

export default inviteRouter;