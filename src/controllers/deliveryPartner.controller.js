import DeliveryPartner from "../models/DeliveryPartner.model.js";
import Order from "../models/Order.model.js";

// Helper to get partner from user ID
const getPartner = async (userId) => {
    return await DeliveryPartner.findOne({ user: userId });
};

// 1️⃣ PROFILE MANAGEMENT
export const getProfile = async (req, res) => {
    try {
        const partner = await getPartner(req.user.id);
        if (!partner) {
            return res.status(404).json({ success: false, message: "Delivery partner profile not found" });
        }
        res.status(200).json({ success: true, data: partner });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { name, phone, vehicleNumber } = req.body;
        const partner = await DeliveryPartner.findOneAndUpdate(
            { user: req.user.id },
            { name, phone, vehicleNumber },
            { new: true, runValidators: true }
        );

        if (!partner) {
            return res.status(404).json({ success: false, message: "Delivery partner profile not found" });
        }

        res.status(200).json({ success: true, message: "Profile updated", data: partner });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2️⃣ ONLINE / OFFLINE TOGGLE
export const toggleOnline = async (req, res) => {
    try {
        const partner = await getPartner(req.user.id);
        if (!partner) {
            return res.status(404).json({ success: false, message: "Delivery partner profile not found" });
        }

        partner.isOnline = !partner.isOnline;
        await partner.save();

        res.status(200).json({
            success: true,
            message: `Partner is now ${partner.isOnline ? "ONLINE" : "OFFLINE"}`,
            isOnline: partner.isOnline
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3️⃣ ASSIGNED ORDERS
export const getOrders = async (req, res) => {
    try {
        const partner = await getPartner(req.user.id);
        if (!partner) {
            return res.status(404).json({ success: false, message: "Partner record for user not found" });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = { deliveryPartner: partner._id };
        if (req.query.status) {
            query.orderStatus = req.query.status;
        }

        const orders = await Order.find(query)
            .populate("restaurant", "name location phone")
            .populate("user", "name phone")
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

// 4️⃣ ACCEPT / REJECT ORDER
export const acceptOrder = async (req, res) => {
    try {
        const partner = await getPartner(req.user.id);
        if (!partner) {
            return res.status(404).json({ success: false, message: "Partner record for user not found" });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.orderStatus !== "PENDING_ASSIGNMENT") {
            return res.status(400).json({ success: false, message: "Order cannot be accepted in current state" });
        }

        order.orderStatus = "ACCEPTED";
        order.deliveryPartner = partner._id;
        await order.save();

        res.status(200).json({ success: true, message: "Order accepted", data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const rejectOrder = async (req, res) => {
    try {
        const partner = await getPartner(req.user.id);
        if (!partner) {
            return res.status(404).json({ success: false, message: "Partner record for user not found" });
        }

        const order = await Order.findOne({ _id: req.params.id, deliveryPartner: partner._id });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found or not assigned to you" });
        }

        order.orderStatus = "PENDING_ASSIGNMENT";
        order.deliveryPartner = null;
        await order.save();

        res.status(200).json({ success: true, message: "Order rejected" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5️⃣ ORDER STATUS FLOW
export const updateOrderStatus = async (req, res) => {
    try {
        const partner = await getPartner(req.user.id);
        const { status } = req.body;
        const allowedStatuses = ["PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status update" });
        }

        const order = await Order.findOne({ _id: req.params.id, deliveryPartner: partner._id });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found or not assigned to you" });
        }

        order.orderStatus = status;
        await order.save();

        // If delivered, update partner stats
        if (status === "DELIVERED") {
            const deliveryFee = order.bill?.deliveryFee || 0;
            await DeliveryPartner.findByIdAndUpdate(partner._id, {
                $inc: {
                    totalDeliveries: 1,
                    totalEarnings: deliveryFee
                }
            });
        }

        res.status(200).json({ success: true, message: `Status updated to ${status}`, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 6️⃣ EARNINGS DASHBOARD
export const getEarnings = async (req, res) => {
    try {
        const partner = await getPartner(req.user.id);
        if (!partner) return res.status(404).json({ success: false, message: "Partner not found" });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Earnings aggregation
        const earningsStats = await Order.aggregate([
            {
                $match: {
                    deliveryPartner: partner._id,
                    orderStatus: "DELIVERED"
                }
            },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: "$bill.deliveryFee" },
                    todayEarnings: {
                        $sum: {
                            $cond: [{ $gte: ["$createdAt", today] }, "$bill.deliveryFee", 0]
                        }
                    },
                    totalDeliveries: { $sum: 1 }
                }
            }
        ]);

        // Weekly chart data
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const weeklyEarnings = await Order.aggregate([
            {
                $match: {
                    deliveryPartner: partner._id,
                    orderStatus: "DELIVERED",
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$bill.deliveryFee" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const stats = {
            todayEarnings: earningsStats[0]?.todayEarnings || 0,
            totalEarnings: earningsStats[0]?.totalEarnings || 0,
            totalDeliveries: earningsStats[0]?.totalDeliveries || 0,
            weeklyEarningsChart: weeklyEarnings.map(item => ({
                date: item._id,
                earnings: item.revenue
            }))
        };

        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 7️⃣ DELIVERY HISTORY
export const getHistory = async (req, res) => {
    try {
        const partner = await getPartner(req.user.id);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {
            deliveryPartner: partner._id,
            orderStatus: "DELIVERED"
        };

        if (req.query.date) {
            const searchDate = new Date(req.query.date);
            const nextDay = new Date(req.query.date);
            nextDay.setDate(nextDay.getDate() + 1);
            query.createdAt = { $gte: searchDate, $lt: nextDay };
        }

        const history = await Order.find(query)
            .populate("restaurant", "name location")
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        const totalCount = await Order.countDocuments(query);

        res.status(200).json({
            success: true,
            data: history,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
            totalCount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 8️⃣ LOCATION TRACKING
export const updateLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body;
        const partner = await DeliveryPartner.findOneAndUpdate(
            { user: req.user.id },
            { location: { lat, lng } },
            { new: true }
        );

        if (!partner) return res.status(404).json({ success: false, message: "Partner not found" });

        res.status(200).json({ success: true, message: "Location updated", data: partner.location });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
