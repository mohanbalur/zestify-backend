import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: { type: String, required: true }, // Cloudinary URL
    rating: { type: Number, default: 0 },
    cuisines: [{ type: String }],
    deliveryTime: { type: Number }, // minutes
    isOpen: { type: Boolean, default: true },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true
      }
    }
  },
  { timestamps: true }
);

restaurantSchema.index({ location: "2dsphere" });

const Restaurant = mongoose.model("Restaurant", restaurantSchema);
export default Restaurant;
