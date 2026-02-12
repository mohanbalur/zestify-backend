import mongoose from "mongoose";
import Cart from "../models/Cart.model.js";
import Address from "../models/Address.model.js";
import Order from "../models/Order.model.js";
import Coupon from "../models/Coupon.model.js";
import CouponUsage from "../models/CouponUsage.model.js";

export const placeOrder = async (req, res) => {
  try {
    const { addressId, paymentMethod, couponCode, items: requestItems, totalAmount: requestTotal, restaurantId: requestRestaurantId } = req.body;

    // STEP 1: DEBUG BACKEND ORDER CONTROLLER FIRST
    console.log('=== 🛠️ DEBUGGING ORDER PLACEMENT ===');
    console.log('userId:', req.user?.id);
    console.log('addressId:', addressId);
    console.log('paymentMethod:', paymentMethod);
    console.log('couponCode:', couponCode);

    if (!req.user || !req.user.id) {
      console.log('❌ Error: User not authenticated');
      return res.status(401).json({ message: "User not authenticated" });
    }

    // STEP 2: FIX CART → ORDER DEPENDENCY
    const cart = await Cart.findOne({ user: req.user.id }).populate("items.menuItem");

    if (!cart) {
      console.log('❌ Error: Cart not found for user', req.user.id);
      return res.status(400).json({ message: "Cart is empty" });
    }

    if (!cart.items || cart.items.length === 0) {
      console.log('❌ Error: Cart exists but is empty');
      return res.status(400).json({ message: "Cart is empty" });
    }

    console.log('✅ Cart data found:', {
      restaurant: cart.restaurant,
      itemCount: cart.items.length
    });

    // STEP 3: VALIDATE ORDER REQUEST BODY
    if (!addressId) {
      return res.status(400).json({ message: "Delivery address is required" });
    }

    // Identify exactly where backend crashes (invalid ObjectId)
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      console.log('❌ Error: Invalid addressId format', addressId);
      return res.status(400).json({
        message: "Invalid address selection. Please select a valid address from your profile.",
        received: addressId
      });
    }

    const address = await Address.findById(addressId);
    if (!address) {
      console.log('❌ Error: Address not found in DB', addressId);
      return res.status(404).json({ message: "Selected address not found" });
    }

    console.log('✅ DeliveryAddress verified:', address.street, address.city);

    let itemTotal = 0;

    const items = cart.items.map((item, index) => {
      // Ensure menuItem exists (populated)
      if (!item.menuItem) {
        throw new Error(`MenuItem not found for cart item at index ${index}`);
      }

      const basePrice = Number(item.menuItem.price) || Number(item.price) || 0;

      const addonsTotal = (item.addons || []).reduce((sum, a) => {
        const addonPrice = Number(a.price) || 0;
        return sum + addonPrice;
      }, 0);

      const total = (basePrice + addonsTotal) * item.quantity;
      itemTotal += total;

      return {
        menuItem: item.menuItem._id,
        name: item.menuItem.name,
        price: basePrice,
        quantity: item.quantity,
        addons: item.addons.map(a => ({
          name: a.name,
          price: Number(a.price) || 0
        }))
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

      if (!coupon || (coupon.expiresAt && Number(coupon.expiresAt) < Date.now())) {
        return res.status(400).json({ message: "Invalid or expired coupon" });
      }

      const alreadyUsed = await CouponUsage.findOne({
        user: req.user.id,
        coupon: coupon._id
      });

      if (alreadyUsed) {
        return res.status(400).json({ message: "Coupon already used" });
      }

      if (Number(itemTotal) < Number(coupon.minOrderValue)) {
        return res.status(400).json({
          message: `Minimum order ₹${coupon.minOrderValue} required`
        });
      }

      if (coupon.type === "FLAT") {
        discount = Number(coupon.value) || 0;
      }

      if (coupon.type === "PERCENT") {
        discount = Math.round((Number(coupon.value) / 100) * Number(itemTotal));
        if (coupon.maxDiscount) {
          discount = Math.min(discount, Number(coupon.maxDiscount));
        }
      }

      appliedCoupon = coupon;
    }

    const calculatedGrandTotal = Number(itemTotal) + Number(deliveryFee) + Number(tax) - Number(discount);

    // Optional: Align with frontend perceived total if provided
    if (requestTotal && Math.abs(Number(requestTotal) - calculatedGrandTotal) > 1) {
      console.log('⚠️ Warning: Total mismatch. Frontend:', requestTotal, 'Backend:', calculatedGrandTotal);
    }

    const order = await Order.create({
      user: req.user.id,
      restaurant: cart.restaurant,
      address: address.toObject ? address.toObject() : address,
      items: items,
      bill: {
        itemTotal: Number(itemTotal),
        deliveryFee: Number(deliveryFee),
        tax: Number(tax),
        discount: Number(discount),
        grandTotal: Number(calculatedGrandTotal)
      },
      couponCode,
      paymentMethod: paymentMethod || "COD"
    });

    console.log('🚀 SUCCESS: Order ID', order._id, 'created. Restaurant:', order.restaurant, 'User:', order.user);

    if (appliedCoupon) {
      await CouponUsage.create({
        user: req.user.id,
        coupon: appliedCoupon._id,
        order: order._id
      });
    }

    await Cart.findOneAndDelete({ user: req.user.id });
    console.log('🧹 Cart clearing after success');

    res.status(201).json(order);
  } catch (error) {
    console.error('💥 ERROR IN PLACE_ORDER:', error);

    // Log to a file for persistent debugging
    try {
      const fs = await import('fs');
      const logMsg = `\n[${new Date().toISOString()}] ERROR: ${error.message}\nSTACK: ${error.stack}\n`;
      fs.appendFileSync('order_debug.log', logMsg);
    } catch (e) { }

    res.status(500).json({
      message: "Internal server error during order placement",
      error: error.message
    });
  }
};
export const getUserOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.id })
    .populate("restaurant", "name image location")
    .sort({ createdAt: -1 });

  res.status(200).json(orders);
};

export const getOrderById = async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user.id
  }).populate("restaurant", "name image location");

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
