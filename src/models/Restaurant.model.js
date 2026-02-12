import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: { type: String, required: true },
    heroImageUrl: { type: String }, // NEW: Restaurant specific hero image
    rating: { type: Number, default: 0 },
    cuisines: [{ type: String }],
    deliveryTime: { type: Number }, // minutes
    isOpen: { type: Boolean, default: true },

    // 🔥 NEW FIELDS FOR FILTERS
    isPureVeg: {
      type: Boolean,
      default: false
    },
    avgPriceForTwo: {
      type: Number // eg: 300
    },
    hasOffer: {
      type: Boolean,
      default: false
    },
    serviceRadius: {
      type: Number,
      default: 5 // Default 5km
    },

    location: {
      type: {
        type: String,
        enum: ["Point"], // 'location.type' must be 'Point'
        default: "Point"
      },
      coordinates: {
        type: [Number],
        required: true,
        default: [0, 0] // Default coordinates to avoid validation error if not provided
      },
      address: {
        type: String,
        required: true
      }
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

restaurantSchema.index({ location: "2dsphere" });

const Restaurant = mongoose.model("Restaurant", restaurantSchema);
export default Restaurant;
