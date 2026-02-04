import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import {
    getProfile,
    updateProfile,
    toggleOnline,
    getOrders,
    acceptOrder,
    rejectOrder,
    updateOrderStatus,
    getEarnings,
    getHistory,
    updateLocation
} from "../controllers/deliveryPartner.controller.js";

const router = express.Router();

// 🔐 Protect all routes - Only Delivery Partners
router.use(authMiddleware, authorize("delivery_partner"));

// 1️⃣ Profile
router.get("/profile", getProfile);
router.patch("/profile", updateProfile);

// 2️⃣ Online/Offline
router.patch("/toggle-online", toggleOnline);

// 3️⃣ Orders
router.get("/orders", getOrders);
router.patch("/orders/:id/accept", acceptOrder);
router.patch("/orders/:id/reject", rejectOrder);
router.patch("/orders/:id/status", updateOrderStatus);

// 4️⃣ Dashboard & History
router.get("/earnings", getEarnings);
router.get("/history", getHistory);

// 5️⃣ Tracking
router.patch("/location", updateLocation);

export default router;
