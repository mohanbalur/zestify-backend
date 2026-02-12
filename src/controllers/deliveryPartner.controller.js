import DeliveryPartner from "../models/DeliveryPartner.model.js";
import User from "../models/User.model.js";
import Order from "../models/Order.model.js";

const PROFILE_FIELDS = "name phone vehicleNumber isOnline totalDeliveries totalEarnings walletBalance";

const getPartner = async (userId) => {
    let partner = await DeliveryPartner.findOne({ user: userId });

    if (!partner) {
        console.log(`Lazy creating partner profile for user: ${userId}`);
        const user = await User.findById(userId);
        if (user && user.role === "delivery_partner") {
            partner = await DeliveryPartner.create({
                user: user._id,
                name: user.name,
                phone: user.phone,
                vehicleNumber: "PENDING"
            });
        }
    }
    return partner;
};

const respondInternalError = (res) => {
    return res.status(500).json({
        success: false,
        message: "Internal server error"
    });
};

export const getProfile = async (req, res) => {
    try {
        const partner = await getPartner(req.user.id);
        if (!partner) {
            return res.status(404).json({ success: false, message: "Delivery partner record not found" });
        }

        return res.status(200).json({
            success: true,
            data: {
                name: partner.name,
                phone: partner.phone,
                vehicleNumber: partner.vehicleNumber,
                isOnline: partner.isOnline,
                totalDeliveries: partner.totalDeliveries,
                totalEarnings: partner.totalEarnings,
                walletBalance: partner.walletBalance
            }
        });
    } catch (error) {
        console.error("getProfile error:", error);
        return respondInternalError(res);
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { name, phone, vehicleNumber } = req.body;
        const partner = await DeliveryPartner.findOneAndUpdate(
            { user: req.user.id },
            { name, phone, vehicleNumber },
            { new: true, runValidators: true, upsert: true }
        );

        return res.status(200).json({
            success: true,
            message: "Profile updated",
            data: {
                name: partner.name,
                phone: partner.phone,
                vehicleNumber: partner.vehicleNumber,
                isOnline: partner.isOnline,
                totalDeliveries: partner.totalDeliveries,
                totalEarnings: partner.totalEarnings,
                walletBalance: partner.walletBalance
            }
        });
    } catch (error) {
        return respondInternalError(res);
    }
};

export const toggleOnline = async (req, res) => {
    try {
        const partner = await getPartner(req.user.id);
        if (!partner) {
            return res.status(404).json({ success: false, message: "Delivery partner record not found" });
        }

        partner.isOnline = !partner.isOnline;
        await partner.save();

        return res.status(200).json({
            success: true,
            message: `Partner is now ${partner.isOnline ? "ONLINE" : "OFFLINE"}`,
            isOnline: partner.isOnline,
            data: {
                name: partner.name,
                phone: partner.phone,
                vehicleNumber: partner.vehicleNumber,
                isOnline: partner.isOnline,
                totalDeliveries: partner.totalDeliveries,
                totalEarnings: partner.totalEarnings,
                walletBalance: partner.walletBalance
            }
        });
    } catch (error) {
        return respondInternalError(res);
    }
};

export const getOrders = async (req, res) => {
    try {
        console.log(`📡 getOrders API hit by User: ${req.user.id}`);
        const partner = await getPartner(req.user.id);
        if (!partner) {
            return res.status(404).json({ success: false, message: "Partner record for user not found" });
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const query = {
            $or: [
                { deliveryPartner: partner._id },
                { deliveryPartner: null, orderStatus: "PENDING_ASSIGNMENT" }
            ]
        };

        console.log(`🔍 getOrders Query for Partner ${partner._id}:`, JSON.stringify(query, null, 2));

        // Explicitly check for status from query
        if (req.query.status) {
            query.orderStatus = req.query.status;
            delete query.$or;
            if (req.query.status === "PENDING_ASSIGNMENT") {
                query.deliveryPartner = null;
            } else {
                query.deliveryPartner = partner._id;
            }
        } else {
            query.$or[0].orderStatus = { $in: ["ACCEPTED", "PICKED_UP", "OUT_FOR_DELIVERY"] };
        }

        const orders = await Order.find(query)
            .populate("restaurant", "name location phone")
            .populate("user", "name phone")
            .populate("items.menuItem", "name imageUrl price category")
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        console.log(`📦 getOrders Results Count: ${orders.length}`);

        const totalCount = await Order.countDocuments(query);

        return res.status(200).json({
            success: true,
            data: orders,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
            totalCount
        });
    } catch (error) {
        return respondInternalError(res);
    }
};

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

        return res.status(200).json({ success: true, message: "Order accepted", data: order });
    } catch (error) {
        return respondInternalError(res);
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

        return res.status(200).json({ success: true, message: "Order rejected" });
    } catch (error) {
        return respondInternalError(res);
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const partner = await getPartner(req.user.id);
        if (!partner) {
            return res.status(404).json({ success: false, message: "Partner record for user not found" });
        }

        const { status } = req.body;
        const allowedStatuses = ["PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status update" });
        }

        const order = await Order.findOne({ _id: req.params.id, deliveryPartner: partner._id });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found or not assigned to you" });
        }

        const previousStatus = order.orderStatus;
        order.orderStatus = status;
        await order.save();

        if (status === "DELIVERED" && previousStatus !== "DELIVERED") {
            const deliveryFee = order.bill?.deliveryFee || 0;
            await DeliveryPartner.findByIdAndUpdate(partner._id, {
                $inc: {
                    totalDeliveries: 1,
                    totalEarnings: deliveryFee,
                    walletBalance: deliveryFee
                }
            });
        }

        return res.status(200).json({ success: true, message: `Status updated to ${status}`, data: order });
    } catch (error) {
        return respondInternalError(res);
    }
};

export const getEarnings = async (req, res) => {
    try {
        const partner = await getPartner(req.user.id);
        if (!partner) {
            return res.status(404).json({ success: false, message: "Partner record not found" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [todayStats] = await Order.aggregate([
            {
                $match: {
                    deliveryPartner: partner._id,
                    orderStatus: "DELIVERED",
                    updatedAt: { $gte: today, $lt: tomorrow }
                }
            },
            {
                $group: {
                    _id: null,
                    todayEarnings: { $sum: { $ifNull: ["$bill.deliveryFee", 0] } },
                    totalDeliveries: { $sum: 1 }
                }
            }
        ]);

        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);

        const weeklyRaw = await Order.aggregate([
            {
                $match: {
                    deliveryPartner: partner._id,
                    orderStatus: "DELIVERED",
                    updatedAt: { $gte: sevenDaysAgo, $lt: tomorrow }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                    earnings: { $sum: { $ifNull: ["$bill.deliveryFee", 0] } },
                    deliveries: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const weeklyMap = new Map(weeklyRaw.map((item) => [item._id, item]));
        const weeklyDays = [];

        for (let i = 0; i < 7; i += 1) {
            const date = new Date(sevenDaysAgo);
            date.setDate(sevenDaysAgo.getDate() + i);
            const key = date.toISOString().split("T")[0];
            const day = weeklyMap.get(key);

            weeklyDays.push({
                date: key,
                earnings: day?.earnings || 0,
                deliveries: day?.deliveries || 0
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                todayEarnings: todayStats?.todayEarnings || 0,
                totalDeliveries: partner.totalDeliveries || 0,
                walletBalance: partner.walletBalance || 0,
                totalEarnings: partner.totalEarnings || 0,
                weeklyStats: {
                    from: weeklyDays[0]?.date,
                    to: weeklyDays[weeklyDays.length - 1]?.date,
                    days: weeklyDays
                },
                weeklyEarningsChart: weeklyDays.map((day) => ({
                    date: day.date,
                    earnings: day.earnings
                }))
            }
        });
    } catch (error) {
        return respondInternalError(res);
    }
};

export const getHistory = async (req, res) => {
    try {
        const partner = await getPartner(req.user.id);
        if (!partner) {
            return res.status(404).json({ success: false, message: "Partner record for user not found" });
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
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
            .populate("restaurant", "name location phone")
            .populate("user", "name phone")
            .populate("items.menuItem", "name imageUrl price category")
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        const totalCount = await Order.countDocuments(query);

        return res.status(200).json({
            success: true,
            data: history,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
            totalCount
        });
    } catch (error) {
        return respondInternalError(res);
    }
};

export const updateLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body;
        const partner = await DeliveryPartner.findOneAndUpdate(
            { user: req.user.id },
            { location: { lat, lng } },
            { new: true }
        );

        if (!partner) {
            return res.status(404).json({ success: false, message: "Partner not found" });
        }

        return res.status(200).json({ success: true, message: "Location updated", data: partner.location });
    } catch (error) {
        return respondInternalError(res);
    }
};
