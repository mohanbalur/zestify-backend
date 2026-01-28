import express from "express";
import { sendOtp, verifyOtp } from "../controllers/auth.controller.js";
import { otpLimiter } from "../middlewares/otpRateLimit.middleware.js";

const router = express.Router();

// TEST ROUTE (VERY IMPORTANT)
router.get("/ping", (req, res) => {
  res.json({ message: "Auth route is working ✅" });
});

// OTP ROUTES
router.post("/send-otp", otpLimiter, sendOtp);
router.post("/verify-otp", verifyOtp);

export default router;
