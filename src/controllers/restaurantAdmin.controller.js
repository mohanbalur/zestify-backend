import Restaurant from "../models/Restaurant.model.js";
import MenuItem from "../models/MenuItem.model.js";
import Order from "../models/Order.model.js";
import DeliveryPartner from "../models/DeliveryPartner.model.js";
import { v2 as cloudinary } from "cloudinary";

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
        const { name, image, heroImageUrl, cuisines, deliveryTime, isPureVeg, avgPriceForTwo, hasOffer, location } = req.body;
        const restaurant = await Restaurant.findOneAndUpdate(
            { owner: req.user.id },
            { name, image, heroImageUrl, cuisines, deliveryTime, isPureVeg, avgPriceForTwo, hasOffer, location },
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

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = { restaurant: restaurant._id, isDeleted: false };
        if (req.query.search) {
            query.name = { $regex: req.query.search, $options: "i" };
        }

        const menu = await MenuItem.find(query)
            .limit(limit)
            .skip(skip)
            .sort({ createdAt: -1 });

        const totalCount = await MenuItem.countDocuments(query);

        res.status(200).json({
            success: true,
            data: menu,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
            totalCount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No image file provided" });
        }

        // The file is already uploaded to Cloudinary by the middleware
        res.status(200).json({
            success: true,
            imageUrl: req.file.path || req.file.secure_url,
            public_id: req.file.filename || req.file.public_id
        });
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

        const { name, description, price, imageUrl, category, isVeg, isAvailable } = req.body;
        const menuItem = await MenuItem.create({
            restaurant: restaurant._id,
            name,
            description,
            price,
            imageUrl,
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
        const { name, description, price, imageUrl, category, isVeg, isAvailable } = req.body;

        const menuItem = await MenuItem.findOneAndUpdate(
            { _id: id, restaurant: restaurant._id, isDeleted: false },
            { name, description, price, imageUrl, category, isVeg, isAvailable },
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
        const menuItem = await MenuItem.findOneAndUpdate(
            { _id: id, restaurant: restaurant._id, isDeleted: false },
            { isDeleted: true },
            { new: true }
        );

        if (!menuItem) {
            return res.status(404).json({ success: false, message: "Menu item not found or unauthorized" });
        }

        res.status(200).json({ success: true, message: "Menu item soft deleted successfully" });
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

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = { restaurant: restaurant._id };
        if (req.query.status) {
            query.orderStatus = req.query.status;
        }

        const orders = await Order.find(query)
            .populate("user", "name phone email")
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        const totalCount = await Order.countDocuments(query);

        res.status(200).json({
            success: true,
            data: orders,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
            totalCount
        });
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
        const allowedStatuses = ["CONFIRMED", "PREPARING", "PENDING_ASSIGNMENT", "ACCEPTED", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

        if (!allowedStatuses.includes(orderStatus)) {
            return res.status(400).json({ success: false, message: "Invalid order status" });
        }

        const order = await Order.findOne({ _id: req.params.id, restaurant: restaurant._id });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (orderStatus === "PENDING_ASSIGNMENT") {
            const availablePartner = await DeliveryPartner.findOne({ isOnline: true }).sort({ updatedAt: 1 });

            if (availablePartner) {
                order.deliveryPartner = availablePartner._id;
                order.orderStatus = "ACCEPTED";
                await order.save();

                return res.status(200).json({
                    success: true,
                    message: "Order assigned to delivery partner",
                    data: order
                });
            }

            order.deliveryPartner = null;
            order.orderStatus = "PENDING_ASSIGNMENT";
            await order.save();

            return res.status(200).json({
                success: true,
                message: "No online delivery partner available. Order left in pending assignment.",
                data: order
            });
        }

        order.orderStatus = orderStatus;
        await order.save();

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
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Core stats
        const totalOrders = await Order.countDocuments({ restaurant: restaurantId });
        const todayOrders = await Order.countDocuments({ restaurant: restaurantId, createdAt: { $gte: today } });
        const pendingOrders = await Order.countDocuments({ restaurant: restaurantId, orderStatus: "PLACED" });
        const cancelledOrders = await Order.countDocuments({ restaurant: restaurantId, orderStatus: "CANCELLED" });

        // Revenue stats
        const revenueStats = await Order.aggregate([
            { $match: { restaurant: restaurantId, paymentStatus: "PAID" } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$bill.grandTotal" }
                }
            }
        ]);

        // Top selling items
        const topSellingItems = await Order.aggregate([
            { $match: { restaurant: restaurantId } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.menuItem",
                    name: { $first: "$items.name" },
                    count: { $sum: "$items.quantity" }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Weekly revenue chart
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const weeklyRevenue = await Order.aggregate([
            {
                $match: {
                    restaurant: restaurantId,
                    paymentStatus: "PAID",
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$bill.grandTotal" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const stats = {
            totalOrders,
            todayOrders,
            pendingOrders,
            cancelledOrders,
            totalRevenue: revenueStats[0]?.totalRevenue || 0,
            topSellingItems,
            weeklyRevenue: weeklyRevenue.map(item => ({
                date: item._id,
                revenue: item.revenue
            }))
        };

        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
