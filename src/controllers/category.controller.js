import Category from "../models/Category.model.js";

// GET /api/categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ name: 1 });

    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};
