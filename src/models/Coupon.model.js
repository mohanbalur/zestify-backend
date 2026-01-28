import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String
    },
    type: {
      type: String,
      enum: ["FLAT", "PERCENT"],
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    minOrderValue: {
      type: Number,
      default: 0
    },
    maxDiscount: {
      type: Number
    },
    applicableOn: {
      type: String,
      enum: ["ALL", "RESTAURANT", "FIRST_ORDER"],
      default: "ALL"
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant"
    },
    isActive: {
      type: Boolean,
      default: true
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
