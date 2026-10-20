import { Router } from "express";
import { authMe, updateProfile } from "./profile.controller";
import { auth } from "../../middleware/auth";
const profileRouter = Router();

profileRouter.get('/me', auth, authMe);
profileRouter.put('/me', auth, updateProfile);
profileRouter.patch('/me', auth, updateProfile);

export default profileRouter;