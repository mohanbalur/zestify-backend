import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const isVideo = file.mimetype.startsWith("video");
        return {
            folder: isVideo ? "zestify/videos" : "zestify/images",
            resource_type: isVideo ? "video" : "image",
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov'],
            // Performance optimizations
            use_filename: false,           // Faster - don't preserve filename
            unique_filename: true,         // Auto-generate unique names
            overwrite: false,              // Prevent accidental overwrites
            quality: "auto:good",          // Auto-optimize quality (30-70% smaller files)
            fetch_format: "auto",          // Auto-select best format (WebP when supported)
            flags: isVideo ? "streaming" : undefined, // Enable streaming for videos
        };
    },
});

// Multer Middleware
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit for videos
    },
});

export default upload;
