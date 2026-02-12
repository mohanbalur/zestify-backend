import express from "express";
import {
    getFoodRestaurants,
    getFoodCategories,
    getFoodItems,
    getFoodItemById
} from "../controllers/food.controller.js";

const router = express.Router();

// GET /api/food/restaurants - Get all restaurants for food discovery
router.get("/restaurants", getFoodRestaurants);

// GET /api/food/categories - Get all categories for food discovery
router.get("/categories", getFoodCategories);

// GET /api/food/items/:id - Get single food item by ID
router.get("/items/:id", getFoodItemById);

// GET /api/food/items - Get food items with optional filters
router.get("/items", getFoodItems);

export default router;
