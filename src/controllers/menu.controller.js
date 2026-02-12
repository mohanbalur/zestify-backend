import MenuItem from "../models/MenuItem.model.js";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/menu/:restaurantId
export const getMenuByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const menuItems = await MenuItem.find({
      restaurant: restaurantId,
      isAvailable: true,
      isDeleted: false
    }).sort({ category: 1 });

    res.status(200).json(menuItems);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch menu" });
  }
};

// GET /api/menu/:restaurantId/search?q=
export const searchMenuItems = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { q } = req.query;

    const menuItems = await MenuItem.find({
      restaurant: restaurantId,
      isAvailable: true,
      isDeleted: false,
      name: { $regex: q, $options: "i" }
    });

    res.status(200).json(menuItems);
  } catch (error) {
    res.status(500).json({ message: "Menu search failed" });
  }
};

// GET /api/menu-items?category=
export const getMenuItemsByCategory = async (req, res) => {
  try {
    const rawCategory = req.query.category ?? "";
    const category = String(rawCategory).trim();

    if (!category) {
      return res.status(200).json([]);
    }

    const categoryRegex = new RegExp(`^${escapeRegExp(category)}$`, "i");

    const menuItems = await MenuItem.find({
      category: { $regex: categoryRegex },
      isAvailable: true,
      isDeleted: false
    }).populate("restaurant", "name isOpen isDeleted");

    const validMenuItems = menuItems.filter(
      (item) => item.restaurant && item.restaurant.isOpen && !item.restaurant.isDeleted
    );

    const results = validMenuItems.map((item) => {
      const itemObject = item.toObject();
      const restaurantId = item.restaurant?._id;
      const restaurantName = item.restaurant?.name;
      const { restaurant, ...rest } = itemObject;

      return {
        ...rest,
        id: rest._id,
        restaurantId,
        restaurantName
      };
    });

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch menu items by category" });
  }
};
