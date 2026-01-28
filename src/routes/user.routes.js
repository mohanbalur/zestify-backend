import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/me", authMiddleware, (req, res) => {
  res.json({
    message: "User profile fetched",
    user: req.user,
  });
});

router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Protected route 🔐",
    user: req.user,
  });
});

export default router;
