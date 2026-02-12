import mongoose from "mongoose";

const heroSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    videoUrl: { type: String, required: true },
    buttonText: { type: String, required: true },
}, { timestamps: true });

const cmsCategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const cmsLaneSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: { type: String },
    description: { type: String },
    image: { type: String, required: true },
    cta: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const cmsOfferSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    mediaUrl: { type: String, required: true }, // image or video
    mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
}, { timestamps: true });

const cmsFooterSchema = new mongoose.Schema({
    section: { type: String, required: true }, // e.g., "Company", "Services"
    label: { type: String, required: true },
    url: { type: String, required: true },
    content: { type: String },
    order: { type: Number, default: 0 },
}, { timestamps: true });

export const CMSHero = mongoose.model("CMSHero", heroSchema);
export const CMSCategory = mongoose.model("CMSCategory", cmsCategorySchema);
export const CMSLane = mongoose.model("CMSLane", cmsLaneSchema);
export const CMSOffer = mongoose.model("CMSOffer", cmsOfferSchema);
export const CMSFooter = mongoose.model("CMSFooter", cmsFooterSchema);
