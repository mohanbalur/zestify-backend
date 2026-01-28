import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} from "../controllers/address.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getAddresses);
router.post("/", addAddress);
router.put("/:id", updateAddress);
router.delete("/:id", deleteAddress);
router.patch("/:id/default", setDefaultAddress);

export default router;
