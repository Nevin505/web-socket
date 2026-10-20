import { Router } from "express";
import { auth } from "../../middleware/auth";
import {
    createGroupHandler,
    getGroupDetailsHandler,
    getUserGroupsHandler,
} from "./group.controller";

const groupRouter = Router();

groupRouter.post("/", auth, createGroupHandler);
groupRouter.get("/", auth, getUserGroupsHandler);
groupRouter.get("/:id", auth, getGroupDetailsHandler);

export default groupRouter;
