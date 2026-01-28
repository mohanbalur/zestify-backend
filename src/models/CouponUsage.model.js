import mongoose from "mongoose";

const couponUsageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order"
    }
  },
  { timestamps: true }
);

// Prevent same user using same coupon twice
couponUsageSchema.index({ user: 1, coupon: 1 }, { unique: true });

const CouponUsage = mongoose.model("CouponUsage", couponUsageSchema);
export default CouponUsage;
