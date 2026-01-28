import Addon from "../models/Addon.model.js";

// GET /api/addons/:menuItemId
export const getAddonsByMenuItem = async (req, res) => {
  try {
    const { menuItemId } = req.params;

    const addons = await Addon.find({
      menuItem: menuItemId,
      isAvailable: true
    });

    res.status(200).json(addons);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch addons" });
  }
};
