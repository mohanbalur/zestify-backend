import Order from "../models/Order.model.js";
import Coupon from "../models/Coupon.model.js";
import CouponUsage from "../models/CouponUsage.model.js";

export const getApplicableCoupons = async (req, res) => {
  const { restaurantId } = req.query;

  // Check if user is first-time user
  const orderCount = await Order.countDocuments({ user: req.user.id });
  const isFirstOrder = orderCount === 0;

  const query = {
    isActive: true,
    expiresAt: { $gt: new Date() },
    $or: [
      { applicableOn: "ALL" },
      ...(restaurantId ? [{
        applicableOn: "RESTAURANT",
        restaurant: restaurantId
      }] : []),
      ...(isFirstOrder ? [{ applicableOn: "FIRST_ORDER" }] : [])
    ]
  };

  const coupons = await Coupon.find(query).select(
    "code description type value maxDiscount minOrderValue"
  );

  res.status(200).json(coupons);
};

export const validateCoupon = async (req, res) => {
  const { code, cartTotal } = req.body;

  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true
  });

  if (!coupon) {
    return res.status(400).json({ valid: false, message: "Invalid coupon" });
  }

  // 🔐 Prevent reuse
  const alreadyUsed = await CouponUsage.findOne({
    user: req.user.id,
    coupon: coupon._id
  });

  if (alreadyUsed) {
    return res.status(400).json({
      valid: false,
      message: "Coupon already used"
    });
  }

  if (coupon.expiresAt < new Date()) {
    return res.status(400).json({ valid: false, message: "Coupon expired" });
  }

  if (cartTotal < coupon.minOrderValue) {
    return res.status(400).json({
      valid: false,
      message: `Minimum order ₹${coupon.minOrderValue} required`
    });
  }

  let discount = 0;

  if (coupon.type === "FLAT") {
    discount = coupon.value;
  }

  if (coupon.type === "PERCENT") {
    discount = Math.round((coupon.value / 100) * cartTotal);
    if (coupon.maxDiscount) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  }

  res.status(200).json({
    valid: true,
    discount,
    message: "Coupon applied successfully"
  });
};
