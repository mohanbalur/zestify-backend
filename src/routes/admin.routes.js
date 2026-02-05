import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import {
    getAllUsers,
    blockUser,
    deleteUser,
    getAllRestaurants,
    createRestaurant,
    toggleRestaurantStatus,
    deleteRestaurant,
    getAllDeliveryPartners,
    createDeliveryPartner,
    deleteDeliveryPartner,
    getAllOrders,
    getStats,
    getNotifications,
    updateAdminProfile, // Added this
} from "../controllers/admin.controller.js";

const router = express.Router();

// 🔐 Middleware to protect all admin routes
router.use(authMiddleware, authorize("super_admin"));

// USERS
router.get("/users", getAllUsers);
router.patch("/users/:id/block", blockUser);
router.delete("/users/:id", deleteUser);

// RESTAURANTS
router.get("/restaurants", getAllRestaurants);
router.post("/restaurants", createRestaurant);
router.patch("/restaurants/:id/toggle", toggleRestaurantStatus);
router.delete("/restaurants/:id", deleteRestaurant);

// DELIVERY PARTNERS
router.get("/delivery", getAllDeliveryPartners);
router.post("/delivery", createDeliveryPartner);
router.delete("/delivery/:id", deleteDeliveryPartner);

// ORDERS
router.get("/orders", getAllOrders);

// DASHBOARD STATS
router.get("/stats", getStats);

// NOTIFICATIONS
router.get("/notifications", getNotifications);

// PROFILE
router.patch("/profile", updateAdminProfile);

export default router;
