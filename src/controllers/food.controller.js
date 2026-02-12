import Restaurant from "../models/Restaurant.model.js";
import Category from "../models/Category.model.js";
import MenuItem from "../models/MenuItem.model.js";

/**
 * GET /api/food/restaurants
 * Fetch all active restaurants for food discovery page
 */
export const getFoodRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.find({
            isOpen: true
        })
            .select("name image rating cuisines deliveryTime isPureVeg avgPriceForTwo hasOffer location")
            .sort({ rating: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            data: restaurants
        });
    } catch (error) {
        console.error("Error fetching food restaurants:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch restaurants"
        });
    }
};

/**
 * GET /api/food/categories
 * Fetch all active food categories for food discovery page
 */
export const getFoodCategories = async (req, res) => {
    try {
        const categories = await Category.find({
            isActive: true
        })
            .select("name image")
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error("Error fetching food categories:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch categories"
        });
    }
};

/**
 * GET /api/food/items
 * Fetch food items with optional filters (category, restaurant)
 * Query params: ?category=CategoryName&restaurant=RestaurantId
 */
export const getFoodItems = async (req, res) => {
    try {
        const { category, restaurant, limit = 50 } = req.query;

        const query = {
            isAvailable: true,
            isDeleted: false
        };

        // Filter by category if provided
        if (category) {
            query.category = { $regex: new RegExp(`^${category}$`, "i") };
        }

        // Filter by restaurant if provided
        if (restaurant) {
            query.restaurant = restaurant;
        }

        const foodItems = await MenuItem.find(query)
            .populate("restaurant", "name image rating cuisines isOpen")
            .select("name description price imageUrl category isVeg restaurant")
            .limit(Number(limit))
            .sort({ createdAt: -1 });

        // Filter out items from closed or deleted restaurants
        const validItems = foodItems.filter(
            (item) => item.restaurant && item.restaurant.isOpen
        );

        // Format response
        const formattedItems = validItems.map((item) => ({
            _id: item._id,
            name: item.name,
            description: item.description,
            price: item.price,
            imageUrl: item.imageUrl,
            category: item.category,
            isVeg: item.isVeg,
            restaurant: {
                _id: item.restaurant._id,
                name: item.restaurant.name,
                image: item.restaurant.image,
                rating: item.restaurant.rating,
                cuisines: item.restaurant.cuisines
            }
        }));

        res.status(200).json({
            success: true,
            data: formattedItems
        });
    } catch (error) {
        console.error("Error fetching food items:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch food items"
        });
    }
};

/**
 * GET /api/food/items/:id
 * Get single food item details by ID
 */
export const getFoodItemById = async (req, res) => {
    try {
        const { id } = req.params;

        const foodItem = await MenuItem.findById(id)
            .populate("restaurant", "name image rating cuisines deliveryTime location isOpen")
            .select("name description price imageUrl category isVeg isAvailable restaurant");

        if (!foodItem) {
            return res.status(404).json({
                success: false,
                message: "Food item not found"
            });
        }

        if (!foodItem.isAvailable || foodItem.isDeleted) {
            return res.status(404).json({
                success: false,
                message: "Food item is not available"
            });
        }

        if (!foodItem.restaurant || !foodItem.restaurant.isOpen) {
            return res.status(404).json({
                success: false,
                message: "Restaurant is currently closed"
            });
        }

        res.status(200).json({
            success: true,
            data: {
                _id: foodItem._id,
                name: foodItem.name,
                description: foodItem.description,
                price: foodItem.price,
                imageUrl: foodItem.imageUrl,
                category: foodItem.category,
                isVeg: foodItem.isVeg,
                restaurant: {
                    _id: foodItem.restaurant._id,
                    name: foodItem.restaurant.name,
                    image: foodItem.restaurant.image,
                    rating: foodItem.restaurant.rating,
                    cuisines: foodItem.restaurant.cuisines,
                    deliveryTime: foodItem.restaurant.deliveryTime,
                    location: foodItem.restaurant.location
                }
            }
        });
    } catch (error) {
        console.error("Error fetching food item by ID:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch food item"
        });
    }
};
