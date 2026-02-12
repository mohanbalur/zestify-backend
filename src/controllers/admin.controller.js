import User from "../models/User.model.js";
import Restaurant from "../models/Restaurant.model.js";
import Order from "../models/Order.model.js";
import DeliveryPartner from "../models/DeliveryPartner.model.js";
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

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email: adminEmail }, { phone: adminPhone }] });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === adminEmail
                    ? "User with this email already exists"
                    : "User with this phone number already exists"
            });
        }

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
        console.error("❌ Create restaurant error details:", {
            message: error.message,
            code: error.code,
            keyPattern: error.keyPattern,
            keyValue: error.keyValue,
            stack: error.stack
        });
        console.log("Request Body:", JSON.stringify(req.body, null, 2));

        // Return more specific error to frontend if possible
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: `Duplicate key error: ${JSON.stringify(error.keyValue)} already exists.`
            });
        }

        res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleRestaurantStatus = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        // Use findByIdAndUpdate to bypass full document validation for a simple toggle
        const updatedRestaurant = await Restaurant.findByIdAndUpdate(
            req.params.id,
            { isOpen: !restaurant.isOpen },
            { new: true, runValidators: false }
        );

        res.status(200).json({
            success: true,
            message: `Restaurant ${updatedRestaurant.isOpen ? "activated" : "deactivated"} successfully`,
            data: updatedRestaurant
        });
    } catch (error) {
        console.error("❌ Toggle status error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        // Also delete the associated admin user
        if (restaurant.owner) {
            await User.findByIdAndDelete(restaurant.owner);
        }

        res.status(200).json({ success: true, message: "Restaurant and its Admin deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= DELIVERY PARTNER MANAGEMENT =================

export const getAllDeliveryPartners = async (req, res) => {
    try {
        const profiles = await DeliveryPartner.find()
            .populate("user", "email");

        // Map to format expected by AdminDeliveryPartners.jsx
        const partners = profiles.map(p => ({
            _id: p.user?._id || p._id, // User ID for deletion compatibility
            name: p.name,
            email: p.user?.email || "N/A",
            phone: p.phone,
            vehicleNumber: p.vehicleNumber,
            isOnline: p.isOnline
        }));

        res.status(200).json({ success: true, data: partners });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createDeliveryPartner = async (req, res) => {
    try {
        const { name, email, phone, password, vehicleNumber } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Create User Account
        const user = await User.create({
            name,
            email,
            phone,
            password: hashedPassword,
            role: "delivery_partner"
        });

        // 2. Create Delivery Partner Profile
        const partnerProfile = await DeliveryPartner.create({
            user: user._id,
            name,
            phone,
            vehicleNumber: vehicleNumber || "N/A"
        });

        res.status(201).json({
            success: true,
            message: "Delivery partner created successfully with profile",
            data: {
                id: user._id,
                name: user.name,
                role: user.role,
                profile: partnerProfile
            }
        });
    } catch (error) {
        console.error("❌ Create delivery partner error:", error);
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

// ================= NOTIFICATIONS =================

export const getNotifications = async (req, res) => {
    try {
        // Fetch recent 5 orders
        const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).select('createdAt _id bill');

        // Fetch recent 5 users
        const recentUsers = await User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(5).select('createdAt name');

        // Fetch recent 5 restaurants
        const recentRestaurants = await Restaurant.find().sort({ createdAt: -1 }).limit(5).select('createdAt name');

        // Combine and map to standard structure
        const notifications = [
            ...recentOrders.map(o => ({
                id: o._id,
                title: `New Order #${o._id.toString().slice(-4)}`,
                message: `Order of ₹${o.bill?.grandTotal} received`,
                time: o.createdAt,
                type: 'order',
                color: 'text-blue-400'
            })),
            ...recentUsers.map(u => ({
                id: u._id,
                title: 'New User',
                message: `${u.name} joined the platform`,
                time: u.createdAt,
                type: 'user',
                color: 'text-emerald-400'
            })),
            ...recentRestaurants.map(r => ({
                id: r._id,
                title: 'New Restaurant',
                message: `${r.name} is now a partner`,
                time: r.createdAt,
                type: 'restaurant',
                color: 'text-yellow-400'
            }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time));

        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

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

export const updateAdminProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email, password } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (name) user.name = name;

        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ success: false, message: "Email already in use" });
            }
            user.email = email;
        }

        if (password) {
            if (password.length < 6) {
                return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
            }
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully. Please login again.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ success: false, message: "Failed to update profile" });
    }
};
