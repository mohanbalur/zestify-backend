import MenuItem from "../models/MenuItem.model.js";

// GET /api/menu/:restaurantId
export const getMenuByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const menuItems = await MenuItem.find({
      restaurant: restaurantId,
      isAvailable: true
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
      name: { $regex: q, $options: "i" }
    });

    res.status(200).json(menuItems);
  } catch (error) {
    res.status(500).json({ message: "Menu search failed" });
  }
};
