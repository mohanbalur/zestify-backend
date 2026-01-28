import express from "express";
import {
  getMenuByRestaurant,
  searchMenuItems
} from "../controllers/menu.controller.js";

const router = express.Router();

router.get("/:restaurantId", getMenuByRestaurant);
router.get("/:restaurantId/search", searchMenuItems);

export default router;
