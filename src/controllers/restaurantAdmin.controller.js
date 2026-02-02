import Restaurant from "../models/Restaurant.model.js";
import MenuItem from "../models/MenuItem.model.js";
import Order from "../models/Order.model.js";

// ==================================================
// 1️⃣ RESTAURANT PROFILE MANAGEMENT
// ==================================================

export const getProfile = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user.id });
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }
        res.status(200).json({ success: true, data: restaurant });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { name, image, cuisines, deliveryTime, isPureVeg, avgPriceForTwo, hasOffer, location } = req.body;
        const restaurant = await Restaurant.findOneAndUpdate(
            { owner: req.user.id },
            { name, image, cuisines, deliveryTime, isPureVeg, avgPriceForTwo, hasOffer, location },
            { new: true, runValidators: true }
        );

        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        res.status(200).json({ success: true, message: "Profile updated successfully", data: restaurant });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleStatus = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user.id });
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        restaurant.isOpen = !restaurant.isOpen;
        await restaurant.save();

        res.status(200).json({
            success: true,
            message: `Restaurant is now ${restaurant.isOpen ? "OPEN" : "CLOSED"}`,
            data: { isOpen: restaurant.isOpen }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================================================
// 2️⃣ MENU MANAGEMENT
// ==================================================

export const getMenu = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user.id });
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        const menu = await MenuItem.find({ restaurant: restaurant._id });
        res.status(200).json({ success: true, data: menu });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addMenuItem = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user.id });
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        const { name, description, price, image, category, isVeg, isAvailable } = req.body;
        const menuItem = await MenuItem.create({
            restaurant: restaurant._id,
            name,
            description,
            price,
            image,
            category,
            isVeg,
            isAvailable
        });

        res.status(201).json({ success: true, message: "Menu item added successfully", data: menuItem });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateMenuItem = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user.id });
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        const { id } = req.params;
        const { name, description, price, image, category, isVeg, isAvailable } = req.body;

        const menuItem = await MenuItem.findOneAndUpdate(
            { _id: id, restaurant: restaurant._id },
            { name, description, price, image, category, isVeg, isAvailable },
            { new: true, runValidators: true }
        );

        if (!menuItem) {
            return res.status(404).json({ success: false, message: "Menu item not found or unauthorized" });
        }

        res.status(200).json({ success: true, message: "Menu item updated successfully", data: menuItem });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteMenuItem = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user.id });
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        const { id } = req.params;
        const menuItem = await MenuItem.findOneAndDelete({ _id: id, restaurant: restaurant._id });

        if (!menuItem) {
            return res.status(404).json({ success: false, message: "Menu item not found or unauthorized" });
        }

        res.status(200).json({ success: true, message: "Menu item deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================================================
// 3️⃣ ORDER MANAGEMENT
// ==================================================

export const getOrders = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user.id });
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        const orders = await Order.find({ restaurant: restaurant._id })
            .populate("user", "name phone email")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user.id });
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        const order = await Order.findOne({ _id: req.params.id, restaurant: restaurant._id })
            .populate("user", "name phone email");

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user.id });
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        const { orderStatus } = req.body;
        const allowedStatuses = ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

        if (!allowedStatuses.includes(orderStatus)) {
            return res.status(400).json({ success: false, message: "Invalid order status" });
        }

        const order = await Order.findOneAndUpdate(
            { _id: req.params.id, restaurant: restaurant._id },
            { orderStatus },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.status(200).json({ success: true, message: "Order status updated", data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================================================
// 4️⃣ DASHBOARD STATS
// ==================================================

export const getStats = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user.id });
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        const restaurantId = restaurant._id;

        // Start of today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalOrders = await Order.countDocuments({ restaurant: restaurantId });
        const todayOrders = await Order.countDocuments({
            restaurant: restaurantId,
            createdAt: { $gte: today }
        });

        const revenueStats = await Order.aggregate([
            { $match: { restaurant: restaurantId, paymentStatus: "PAID" } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$bill.grandTotal" },
                    todayRevenue: {
                        $sum: {
                            $cond: [{ $gte: ["$createdAt", today] }, "$bill.grandTotal", 0]
                        }
                    }
                }
            }
        ]);

        const stats = {
            totalOrders,
            todayOrders,
            totalRevenue: revenueStats[0]?.totalRevenue || 0,
            todayRevenue: revenueStats[0]?.todayRevenue || 0
        };

        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
