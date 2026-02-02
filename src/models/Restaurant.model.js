import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: { type: String, required: true },
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
