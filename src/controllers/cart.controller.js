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

  // Log incoming request for debugging
  console.log('=== ADD TO CART REQUEST ===');
  console.log('User ID:', req.user?.id);
  console.log('Request Body:', JSON.stringify(req.body, null, 2));

  // Helper function to normalize ID
  const normalizeId = (id) => {
    if (!id) return null;
    if (typeof id === 'string') return id;
    if (id.$oid) return id.$oid;
    if (id._id) return id._id.toString();
    if (id.toString) return id.toString();
    return null;
  };

  const normalizedRestaurantId = normalizeId(restaurantId);
  const normalizedMenuItemId = normalizeId(menuItemId);

  console.log('Normalized IDs:', { normalizedRestaurantId, normalizedMenuItemId });

  if (!normalizedRestaurantId || !normalizedMenuItemId) {
    console.error('❌ Invalid IDs received:', { restaurantId, menuItemId, types: { rest: typeof restaurantId, menu: typeof menuItemId } });
    return res.status(400).json({
      message: "Invalid restaurant or menu item ID",
      received: { restaurantId, menuItemId }
    });
  }

  if (!mongoose.Types.ObjectId.isValid(normalizedRestaurantId) || !mongoose.Types.ObjectId.isValid(normalizedMenuItemId)) {
    console.error('❌ Invalid ObjectId format:', { restaurantId: normalizedRestaurantId, menuItemId: normalizedMenuItemId });
    return res.status(400).json({
      message: "Invalid restaurant or menu item ID format",
      received: { restaurantId: normalizedRestaurantId, menuItemId: normalizedMenuItemId }
    });
  }

  let cart = await Cart.findOne({ user: req.user.id });
  console.log('Existing cart:', cart ? `Found (restaurant: ${cart.restaurant})` : 'Not found');

  const restaurantObjectId = new mongoose.Types.ObjectId(normalizedRestaurantId);
  const menuItemObjectId = new mongoose.Types.ObjectId(normalizedMenuItemId);

  if (!cart) {
    console.log('✅ Creating new cart');
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
    // enforce single restaurant - FIXED: use normalized ID for comparison
    const cartRestaurantId = cart.restaurant.toString();
    console.log('Restaurant comparison:', { cartRestaurantId, normalizedRestaurantId, match: cartRestaurantId === normalizedRestaurantId });

    if (cartRestaurantId !== normalizedRestaurantId) {
      console.log('❌ Restaurant mismatch - cart has different restaurant');
      return res.status(400).json({
        message: "Cart contains items from another restaurant. Please clear your cart first.",
        currentRestaurant: cartRestaurantId,
        requestedRestaurant: normalizedRestaurantId
      });
    }

    // FIXED: use normalized ID for comparison
    const itemIndex = cart.items.findIndex(
      i => i.menuItem.toString() === normalizedMenuItemId
    );

    console.log('Item search:', { normalizedMenuItemId, itemIndex, found: itemIndex > -1 });

    if (itemIndex > -1) {
      console.log('✅ Updating existing item quantity');
      cart.items[itemIndex].quantity += quantity;
    } else {
      console.log('✅ Adding new item to cart');
      cart.items.push({
        menuItem: menuItemObjectId,
        quantity,
        addons
      });
    }

    await cart.save();
  }

  console.log('✅ Cart operation successful');
  // Return populated cart to ensure frontend has item details
  const populatedCart = await Cart.findById(cart._id).populate("items.menuItem");
  res.status(200).json(populatedCart);
};

// PATCH /api/cart/update
export const updateCartItem = async (req, res) => {
  const { menuItemId, quantity } = req.body;

  // Helper function to normalize ID
  const normalizeId = (id) => {
    if (!id) return null;
    if (typeof id === 'string') return id;
    if (id.$oid) return id.$oid;
    if (id._id) return id._id.toString();
    if (id.toString) return id.toString();
    return null;
  };

  const normalizedMenuItemId = normalizeId(menuItemId);

  if (!normalizedMenuItemId) {
    return res.status(400).json({
      message: "Invalid menu item ID",
      received: { menuItemId }
    });
  }

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  const item = cart.items.find(
    i => i.menuItem.toString() === normalizedMenuItemId
  );

  if (!item) return res.status(404).json({ message: "Item not found" });

  item.quantity = quantity;
  await cart.save();

  // Return populated cart
  const populatedCart = await Cart.findById(cart._id).populate("items.menuItem");
  res.status(200).json(populatedCart);
};

// DELETE /api/cart/remove/:menuItemId
export const removeCartItem = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id });

  // Helper function to normalize ID
  const normalizeId = (id) => {
    if (!id) return null;
    if (typeof id === 'string') return id;
    if (id.$oid) return id.$oid;
    if (id._id) return id._id.toString();
    if (id.toString) return id.toString();
    return null;
  };

  const normalizedMenuItemId = normalizeId(req.params.menuItemId);

  if (!normalizedMenuItemId) {
    return res.status(400).json({
      message: "Invalid menu item ID",
      received: { menuItemId: req.params.menuItemId }
    });
  }

  cart.items = cart.items.filter(
    i => i.menuItem.toString() !== normalizedMenuItemId
  );

  await cart.save();

  // Return populated cart
  const populatedCart = await Cart.findById(cart._id).populate("items.menuItem");
  res.status(200).json(populatedCart);
};

// DELETE /api/cart/clear
export const clearCart = async (req, res) => {
  await Cart.findOneAndDelete({ user: req.user.id });
  res.status(200).json({ message: "Cart cleared" });
};
