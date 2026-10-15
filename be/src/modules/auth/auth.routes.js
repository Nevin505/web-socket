import { Router } from "express";
import { signup, signin, } from "./auth.controller";
const router = Router();
router.post("/signup", signup);
router.post("/login", signin);
export default router;
