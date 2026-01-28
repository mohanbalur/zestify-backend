import express from "express";
import {
  getRestaurants,
  searchRestaurants,
  getRestaurantById,
  getNearbyRestaurants
} from "../controllers/restaurant.controller.js";

const router = express.Router();

router.get("/", getRestaurants);
router.get("/search", searchRestaurants);
router.get("/nearby", getNearbyRestaurants);
router.get("/:id", getRestaurantById);

export default router;
