import express from "express";
import * as cmsController from "../controllers/cms.controller.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

// Media Upload (General purpose for CMS)
router.post("/upload", upload.single("file"), cmsController.uploadMedia);

// Hero
router.get("/hero", cmsController.getHero);
router.post("/hero", upload.single("file"), cmsController.updateHero);

// Categories
router.get("/categories", cmsController.getCategories);
router.post("/categories", upload.single("file"), cmsController.createCategory);
router.put("/categories/:id", upload.single("file"), cmsController.updateCategory);
router.delete("/categories/:id", cmsController.deleteCategory);

// Lanes
router.get("/lanes", cmsController.getLanes);
router.post("/lanes", upload.single("file"), cmsController.createLane);
router.put("/lanes/:id", upload.single("file"), cmsController.updateLane);
router.delete("/lanes/:id", cmsController.deleteLane);

// Offers
router.get("/offers", cmsController.getOffers);
router.post("/offers", upload.single("file"), cmsController.createOffer);
router.put("/offers/:id", upload.single("file"), cmsController.updateOffer);
router.delete("/offers/:id", cmsController.deleteOffer);

// Footer
router.get("/footer", cmsController.getFooter);
router.post("/footer", cmsController.updateFooter);

export default router;
