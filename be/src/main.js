import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes.ts";
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.use("/api/auth", authRoutes);
export default app;
