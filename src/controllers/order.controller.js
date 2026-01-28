import Cart from "../models/Cart.model.js";
import Address from "../models/Address.model.js";
import Order from "../models/Order.model.js";
import Coupon from "../models/Coupon.model.js";
import CouponUsage from "../models/CouponUsage.model.js";

export const placeOrder = async (req, res) => {
  const { addressId, paymentMethod, couponCode } = req.body;

  const cart = await Cart.findOne({ user: req.user.id }).populate("items.menuItem");
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  const address = await Address.findById(addressId);
  if (!address) {
    return res.status(404).json({ message: "Address not found" });
  }

  let itemTotal = 0;

  const items = cart.items.map(item => {
    const addonsTotal = item.addons.reduce((sum, a) => sum + a.price, 0);
    const total = (item.menuItem.price + addonsTotal) * item.quantity;
    itemTotal += total;

    return {
      menuItem: item.menuItem._id,
      name: item.menuItem.name,
      price: item.menuItem.price,
      quantity: item.quantity,
      addons: item.addons
    };
  });

  const deliveryFee = 40;
  const tax = Math.round(itemTotal * 0.05);

  let discount = 0;
  let appliedCoupon = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true
    });

    if (!coupon || coupon.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired coupon" });
    }

    // 🔐 Re-check reuse (MANDATORY)
    const alreadyUsed = await CouponUsage.findOne({
      user: req.user.id,
      coupon: coupon._id
    });

    if (alreadyUsed) {
      return res.status(400).json({ message: "Coupon already used" });
    }

    if (itemTotal < coupon.minOrderValue) {
      return res.status(400).json({
        message: `Minimum order ₹${coupon.minOrderValue} required`
      });
    }

    if (coupon.type === "FLAT") {
      discount = coupon.value;
    }

    if (coupon.type === "PERCENT") {
      discount = Math.round((coupon.value / 100) * itemTotal);
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    }

    appliedCoupon = coupon;
  }

  const grandTotal = itemTotal + deliveryFee + tax - discount;

  const order = await Order.create({
    user: req.user.id,
    restaurant: cart.restaurant,
    address,
    items,
    bill: {
      itemTotal,
      deliveryFee,
      tax,
      discount,
      grandTotal
    },
    couponCode,
    paymentMethod
  });

  // ✅ Lock coupon usage AFTER order success
  if (appliedCoupon) {
    await CouponUsage.create({
      user: req.user.id,
      coupon: appliedCoupon._id,
      order: order._id
    });
  }

  await Cart.findOneAndDelete({ user: req.user.id });

  res.status(201).json(order);
};
export const getUserOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.id })
    .sort({ createdAt: -1 });

  res.status(200).json(orders);
};

export const getOrderById = async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  res.status(200).json(order);
};

export const cancelOrder = async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (order.orderStatus !== "PLACED") {
    return res.status(400).json({ message: "Order cannot be cancelled" });
  }

  order.orderStatus = "CANCELLED";
  await order.save();

  res.status(200).json({ message: "Order cancelled" });
};
