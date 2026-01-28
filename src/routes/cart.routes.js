import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
} from "../controllers/cart.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getCart);
router.post("/add", addToCart);
router.patch("/update", updateCartItem);
router.delete("/remove/:menuItemId", removeCartItem);
router.delete("/clear", clearCart);

export default router;
