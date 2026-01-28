import express from "express";
import {authMiddleware} from "../middlewares/auth.middleware.js";
import {
  validateCoupon,
  getApplicableCoupons
} from "../controllers/coupon.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/applicable", getApplicableCoupons);
router.post("/validate", validateCoupon);

export default router;
