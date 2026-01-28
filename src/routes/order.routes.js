import express from "express";
import {authMiddleware} from "../middlewares/auth.middleware.js";
import {
  placeOrder,
  getUserOrders,
  getOrderById,
  cancelOrder
} from "../controllers/order.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", placeOrder);
router.get("/", getUserOrders);
router.get("/:id", getOrderById);
router.patch("/:id/cancel", cancelOrder);

export default router;
