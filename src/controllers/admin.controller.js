import User from "../models/User.model.js";
import Restaurant from "../models/Restaurant.model.js";
import Order from "../models/Order.model.js";
import bcrypt from "bcrypt";

// ================= USER MANAGEMENT =================

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: "user" }).select("-password");
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const blockUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.isBlocked = !user.isBlocked;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`,
            data: user,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= RESTAURANT MANAGEMENT =================

export const getAllRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.find().populate("owner", "name email phone");
        res.status(200).json({ success: true, data: restaurants });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createRestaurant = async (req, res) => {
    try {
        const { name, image, cuisines, deliveryTime, isPureVeg, avgPriceForTwo, hasOffer, location, adminEmail, adminPassword, adminPhone, adminName } = req.body;

        // 1. Create Restaurant Admin User
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const adminUser = await User.create({
            name: adminName,
            email: adminEmail,
            phone: adminPhone,
            password: hashedPassword,
            role: "restaurant_admin"
        });

        // 2. Create Restaurant
        // Note: Since we cannot modify the model to add an 'owner' field, 
        // we create the restaurant without the link as per schema constraints.
        const restaurant = await Restaurant.create({
            name,
            image,
            cuisines,
            deliveryTime,
            isPureVeg,
            avgPriceForTwo,
            hasOffer,
            location,
            owner: adminUser._id
        });

        res.status(201).json({
            success: true,
            message: "Restaurant and Admin created successfully",
            data: { restaurant, admin: { id: adminUser._id, role: adminUser.role } }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleRestaurantStatus = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        restaurant.isOpen = !restaurant.isOpen;
        await restaurant.save();

        res.status(200).json({
            success: true,
            message: `Restaurant ${restaurant.isOpen ? "activated" : "deactivated"} successfully`,
            data: restaurant
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }
        res.status(200).json({ success: true, message: "Restaurant deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= DELIVERY PARTNER MANAGEMENT =================

export const getAllDeliveryPartners = async (req, res) => {
    try {
        const partners = await User.find({ role: "delivery_partner" }).select("-password");
        res.status(200).json({ success: true, data: partners });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createDeliveryPartner = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const partner = await User.create({
            name,
            email,
            phone,
            password: hashedPassword,
            role: "delivery_partner"
        });

        res.status(201).json({
            success: true,
            message: "Delivery partner created successfully",
            data: { id: partner._id, name: partner.name, role: partner.role }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteDeliveryPartner = async (req, res) => {
    try {
        const partner = await User.findOneAndDelete({ _id: req.params.id, role: "delivery_partner" });
        if (!partner) {
            return res.status(404).json({ success: false, message: "Delivery partner not found" });
        }
        res.status(200).json({ success: true, message: "Delivery partner deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= ORDER MANAGEMENT =================

export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("user", "name email phone")
            .populate("restaurant", "name image");
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= DASHBOARD STATS =================

export const getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: "user" });
        const totalRestaurants = await Restaurant.countDocuments();
        const totalDeliveryPartners = await User.countDocuments({ role: "delivery_partner" });
        const totalOrders = await Order.countDocuments();

        const revenueData = await Order.aggregate([
            { $match: { paymentStatus: "PAID" } },
            { $group: { _id: null, totalRevenue: { $sum: "$bill.grandTotal" } } }
        ]);

        const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalRestaurants,
                totalDeliveryPartners,
                totalOrders,
                totalRevenue
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
