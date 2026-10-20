import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes";
import profileRouter from "./modules/profile/profile.route";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use('/profile',profileRouter)

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on portas ${process.env.PORT} ${PORT}`);
});

export default app;
