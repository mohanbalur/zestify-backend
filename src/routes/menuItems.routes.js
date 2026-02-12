import express from "express";
import { getMenuItemsByCategory } from "../controllers/menu.controller.js";

const router = express.Router();

router.get("/", getMenuItemsByCategory);

export default router;
