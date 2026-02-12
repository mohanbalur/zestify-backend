import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    label: {
      type: String,
      enum: ["Home", "Work", "Other"],
      default: "Home"
    },
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    street: {
      type: String,
      required: true
    },
    area: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: false
    },
    state: {
      type: String,
      required: false
    },
    pincode: {
      type: String,
      required: true
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: false
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: false
      }
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

addressSchema.index({ location: "2dsphere" }, { sparse: true });

const Address = mongoose.model("Address", addressSchema);
export default Address;
