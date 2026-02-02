import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import {
    getProfile,
    updateProfile,
    toggleStatus,
    getMenu,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getOrders,
    getOrderById,
    updateOrderStatus,
    getStats
} from "../controllers/restaurantAdmin.controller.js";

const router = express.Router();

// 🔐 Protect all routes - Only Restaurant Admins
router.use(authMiddleware, authorize("restaurant_admin"));

// ==================================================
// 1️⃣ RESTAURANT PROFILE MANAGEMENT
// ==================================================
router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.patch("/toggle", toggleStatus);

// ==================================================
// 2️⃣ MENU MANAGEMENT
// ==================================================
router.get("/menu", getMenu);
router.post("/menu", addMenuItem);
router.patch("/menu/:id", updateMenuItem);
router.delete("/menu/:id", deleteMenuItem);

// ==================================================
// 3️⃣ ORDER MANAGEMENT
// ==================================================
router.get("/orders", getOrders);
router.get("/orders/:id", getOrderById);
router.patch("/orders/:id/status", updateOrderStatus);

// ==================================================
// 4️⃣ DASHBOARD STATS
// ==================================================
router.get("/stats", getStats);

export default router;
