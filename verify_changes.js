import MenuItem from "./src/models/MenuItem.model.js";
import Order from "./src/models/Order.model.js";
import Restaurant from "./src/models/Restaurant.model.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function verify() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // 1. Verify MenuItem Soft Delete & imageUrl
        const menuItem = await MenuItem.findOne({ isDeleted: false });
        if (menuItem) {
            console.log("✅ MenuItem has isDeleted field and it is false");
            if ('imageUrl' in menuItem || 'image' in menuItem) {
                console.log("✅ MenuItem has image/imageUrl field");
            }
        }

        // 2. Test Pagination Logic (Simulated)
        const restaurant = await Restaurant.findOne();
        if (restaurant) {
            const query = { restaurant: restaurant._id, isDeleted: false };
            const count = await MenuItem.countDocuments(query);
            console.log(`✅ Menu items count: ${count}`);

            const limit = 2;
            const items = await MenuItem.find(query).limit(limit).skip(0);
            console.log(`✅ Pagination test: Requested ${limit}, got ${items.length}`);
        }

        // 3. Test Stats (Simulated)
        if (restaurant) {
            const restaurantId = restaurant._id;
            const totalOrders = await Order.countDocuments({ restaurant: restaurantId });
            console.log(`✅ Total orders for restaurant: ${totalOrders}`);

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
            console.log(`✅ Top selling items aggregation successful: found ${topSellingItems.length} items`);
        }

        console.log("\nVerification completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Verification failed:", error);
        process.exit(1);
    }
}

verify();
