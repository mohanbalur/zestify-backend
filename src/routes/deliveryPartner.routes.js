import express from "express";
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

router.get("/profile", getProfile);
router.patch("/profile", updateProfile);

router.patch("/toggle-online", toggleOnline);

router.get("/orders", getOrders);
router.patch("/orders/:id/accept", acceptOrder);
router.patch("/orders/:id/reject", rejectOrder);
router.patch("/orders/:id/status", updateOrderStatus);

router.get("/earnings", getEarnings);
router.get("/history", getHistory);

router.patch("/location", updateLocation);

export default router;
