
import { Router } from "express";
import {
  signup,
  signin,
  forgotPassword,
  verifyResetTokenController,
  resetPasswordController,
} from "./auth.controller";

const router = Router();

router.post("/signup", signup);
router.post("/login", signin);
router.post("/forgot-password", forgotPassword);
router.get("/verify-reset-token/:token", verifyResetTokenController);
router.post("/reset-password", resetPasswordController);

export default router;
