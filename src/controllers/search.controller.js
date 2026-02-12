import Restaurant from "../models/Restaurant.model.js";
import MenuItem from "../models/MenuItem.model.js";
import Category from "../models/Category.model.js";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/search?q=
export const globalSearch = async (req, res) => {
  try {
    const rawQuery = req.query.q ?? "";
    const query = String(rawQuery).trim();

    if (!query) {
      return res.status(200).json({ success: true, data: [] });
    }

    const regex = new RegExp(escapeRegExp(query), "i");

    const [restaurants, menuItems, categories] = await Promise.all([
      Restaurant.find({
        name: { $regex: regex },
        isOpen: true,
        $or: [
          { isDeleted: false },
          { isDeleted: { $exists: false } },
          { isDeleted: null }
        ]
      }),
      MenuItem.find({
        name: { $regex: regex },
        isAvailable: true,
        isDeleted: false
      }).populate("restaurant", "name isOpen isDeleted"),
      Category.find({
        name: { $regex: regex },
        isActive: true
      })
    ]);


    const restaurantResults = restaurants.map((restaurant) => ({
      type: "restaurant",
      data: restaurant
    }));

    const validMenuItems = menuItems.filter(
      (item) => item.restaurant && item.restaurant.isOpen && !item.restaurant.isDeleted
    );

    const menuResults = validMenuItems.map((item) => {
      const itemObject = item.toObject();
      const restaurantId = item.restaurant?._id;
      const restaurantName = item.restaurant?.name;
      const { restaurant, ...rest } = itemObject;

      return {
        type: "menu",
        data: {
          ...rest,
          id: rest._id,
          restaurantId,
          restaurantName,
          category: rest.category
        }
      };
    });

    const categoryResults = categories.map((category) => ({
      type: "category",
      data: {
        _id: category._id,
        id: category._id,
        name: category.name
      }
    }));

    const results = [...restaurantResults, ...menuResults, ...categoryResults];

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ message: "Search failed" });
  }
};
