import { CMSHero, CMSCategory, CMSLane, CMSOffer, CMSFooter } from "../models/CMS.model.js";

// Hero Section
export const getHero = async (req, res) => {
    try {
        const hero = await CMSHero.findOne().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: hero });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateHero = async (req, res) => {
    try {
        console.log("Updating Hero Section - Body:", req.body);
        console.log("Updating Hero Section - File:", req.file);

        let { title, subtitle, videoUrl, buttonText } = req.body;
        if (req.file) {
            videoUrl = req.file.path || req.file.secure_url;
            console.log("New Hero Video uploaded to Cloudinary:", videoUrl);
        }

        let hero = await CMSHero.findOne();
        console.log("Existing Hero before update:", hero);

        if (hero) {
            hero = await CMSHero.findByIdAndUpdate(hero._id, { title, subtitle, videoUrl, buttonText }, { new: true });
        } else {
            hero = await CMSHero.create({ title, subtitle, videoUrl, buttonText });
        }

        console.log("Hero Section after update:", hero);
        res.status(200).json({ success: true, message: "Hero section updated", data: hero });
    } catch (error) {
        console.error("Hero Update Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Categories
export const getCategories = async (req, res) => {
    try {
        const categories = await CMSCategory.find().sort({ order: 1 });
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createCategory = async (req, res) => {
    try {
        console.log("Creating Category - Body:", req.body);
        console.log("Creating Category - File:", req.file);

        let createData = { ...req.body };
        if (req.file) {
            createData.image = req.file.path || req.file.secure_url;
        }

        const category = await CMSCategory.create(createData);
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        console.error("Create Category Error:", error);
        res.status(500).json({ success: false, message: error.message || error });
    }
};

export const updateCategory = async (req, res) => {
    try {
        console.log(`Updating Category ${req.params.id} - Body:`, req.body);
        console.log(`Updating Category ${req.params.id} - File:`, req.file);

        let updateData = { ...req.body };
        if (req.file) {
            updateData.image = req.file.path || req.file.secure_url;
            console.log("New Category Image uploaded to Cloudinary:", updateData.image);
        }

        const category = await CMSCategory.findByIdAndUpdate(req.params.id, updateData, { new: true });
        console.log("Category after update:", category);

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        res.status(200).json({ success: true, data: category });
    } catch (error) {
        console.error("Category Update Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        await CMSCategory.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Category deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lanes
export const getLanes = async (req, res) => {
    try {
        const lanes = await CMSLane.find().sort({ order: 1 });
        res.status(200).json({ success: true, data: lanes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createLane = async (req, res) => {
    try {
        console.log("--- CREATE LANE ATTEMPT ---");
        console.log("Body:", req.body);
        console.log("File:", req.file);

        let createData = { ...req.body };
        if (req.file) {
            createData.image = req.file.path || req.file.secure_url;
        }

        const lane = await CMSLane.create(createData);
        res.status(201).json({ success: true, data: lane });
    } catch (error) {
        console.error("Create Lane Error:", error);
        res.status(500).json({ success: false, message: error.message || error });
    }
};

export const updateLane = async (req, res) => {
    try {
        console.log(`Updating Lane ${req.params.id} - Body:`, req.body);
        console.log(`Updating Lane ${req.params.id} - File:`, req.file);

        let updateData = { ...req.body };
        if (req.file) {
            console.log("Full req.file object:", JSON.stringify(req.file, null, 2));
            updateData.image = req.file.path || req.file.secure_url;
            console.log("New Lane Image uploaded to Cloudinary:", updateData.image);
        }

        const lane = await CMSLane.findByIdAndUpdate(req.params.id, updateData, { new: true });
        console.log("Lane after update:", lane);

        if (!lane) {
            return res.status(404).json({ success: false, message: "Lane not found" });
        }

        res.status(200).json({ success: true, data: lane });
    } catch (error) {
        console.error("Lane Update Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteLane = async (req, res) => {
    try {
        await CMSLane.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Lane deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Offers
export const getOffers = async (req, res) => {
    try {
        const offers = await CMSOffer.find().sort({ order: 1 });
        res.status(200).json({ success: true, data: offers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createOffer = async (req, res) => {
    try {
        console.log("Creating Offer - Body:", req.body);
        console.log("Creating Offer - File:", req.file);

        let createData = { ...req.body };
        if (req.file) {
            createData.mediaUrl = req.file.path || req.file.secure_url;
            createData.mediaType = req.file.mimetype.startsWith("video/") ? "video" : "image";
        }

        const offer = await CMSOffer.create(createData);
        res.status(201).json({ success: true, data: offer });
    } catch (error) {
        console.error("Create Offer Error:", error);
        res.status(500).json({ success: false, message: error.message || error });
    }
};

export const updateOffer = async (req, res) => {
    try {
        console.log(`Updating Offer ${req.params.id} - Body:`, req.body);
        console.log(`Updating Offer ${req.params.id} - File:`, req.file);

        let updateData = { ...req.body };
        if (req.file) {
            updateData.mediaUrl = req.file.path || req.file.secure_url;
            updateData.mediaType = req.file.mimetype.startsWith("video/") ? "video" : "image";
            console.log(`New Offer ${updateData.mediaType} uploaded to Cloudinary:`, updateData.mediaUrl);
        }

        const offer = await CMSOffer.findByIdAndUpdate(req.params.id, updateData, { new: true });
        console.log("Offer after update:", offer);

        if (!offer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }

        res.status(200).json({ success: true, data: offer });
    } catch (error) {
        console.error("Offer Update Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteOffer = async (req, res) => {
    try {
        await CMSOffer.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Offer deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Footer
export const getFooter = async (req, res) => {
    try {
        const footer = await CMSFooter.find().sort({ section: 1, order: 1 });
        res.status(200).json({ success: true, data: footer });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateFooter = async (req, res) => {
    try {
        const { section, links } = req.body; // links is an array
        // Delete existing links for this section and recreate
        await CMSFooter.deleteMany({ section });
        const newLinks = await CMSFooter.insertMany(links.map(l => ({ ...l, section })));
        res.status(200).json({ success: true, data: newLinks });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// Media Upload
export const uploadMedia = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }
        res.status(200).json({
            success: true,
            url: req.file.path || req.file.secure_url, // Cloudinary URL
            public_id: req.file.filename || req.file.public_id
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
