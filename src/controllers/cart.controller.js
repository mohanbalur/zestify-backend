import mongoose from "mongoose";
import Cart from "../models/Cart.model.js";

// GET /api/cart
export const getCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id })
    .populate("items.menuItem");
  res.status(200).json(cart);
};

// POST /api/cart/add
export const addToCart = async (req, res) => {
  const { restaurantId, menuItemId, quantity = 1, addons = [] } = req.body;

  let cart = await Cart.findOne({ user: req.user.id });

  const restaurantObjectId = new mongoose.Types.ObjectId(restaurantId);
  const menuItemObjectId = new mongoose.Types.ObjectId(menuItemId);

  if (!cart) {
    cart = await Cart.create({
      user: req.user.id,
      restaurant: restaurantObjectId,
      items: [
        {
          menuItem: menuItemObjectId,
          quantity,
          addons
        }
      ]
    });
  } else {
    // enforce single restaurant
    if (cart.restaurant.toString() !== restaurantId) {
      return res.status(400).json({
        message: "Cart contains items from another restaurant"
      });
    }

    const itemIndex = cart.items.findIndex(
      i => i.menuItem.toString() === menuItemId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({
        menuItem: menuItemObjectId,
        quantity,
        addons
      });
    }

    await cart.save();
  }

  res.status(200).json(cart);
};

// PATCH /api/cart/update
export const updateCartItem = async (req, res) => {
  const { menuItemId, quantity } = req.body;

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  const item = cart.items.find(
    i => i.menuItem.toString() === menuItemId
  );

  if (!item) return res.status(404).json({ message: "Item not found" });

  item.quantity = quantity;
  await cart.save();

  res.status(200).json(cart);
};

// DELETE /api/cart/remove/:menuItemId
export const removeCartItem = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id });

  cart.items = cart.items.filter(
    i => i.menuItem.toString() !== req.params.menuItemId
  );

  await cart.save();
  res.status(200).json(cart);
};

// DELETE /api/cart/clear
export const clearCart = async (req, res) => {
  await Cart.findOneAndDelete({ user: req.user.id });
  res.status(200).json({ message: "Cart cleared" });
};
