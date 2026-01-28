import express from "express";
import { getAddonsByMenuItem } from "../controllers/addon.controller.js";

const router = express.Router();

router.get("/:menuItemId", getAddonsByMenuItem);

export default router;
