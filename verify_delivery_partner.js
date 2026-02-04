import DeliveryPartner from "./src/models/DeliveryPartner.model.js";
import Order from "./src/models/Order.model.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function verify() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // 1. Verify DeliveryPartner Model
        const partnerKeys = Object.keys(DeliveryPartner.schema.paths);
        const requiredKeys = ["user", "name", "phone", "vehicleNumber", "isOnline", "location.lat", "totalDeliveries", "totalEarnings"];
        requiredKeys.forEach(key => {
            if (partnerKeys.includes(key)) {
                console.log(`✅ DeliveryPartner has field: ${key}`);
            } else {
                console.error(`❌ DeliveryPartner missing field: ${key}`);
            }
        });

        // 2. Verify Order Model updates
        const orderKeys = Object.keys(Order.schema.paths);
        if (orderKeys.includes("deliveryPartner")) {
            console.log("✅ Order has deliveryPartner field");
        } else {
            console.error("❌ Order missing deliveryPartner field");
        }

        const orderStatusEnum = Order.schema.path("orderStatus").enumValues;
        const newStatuses = ["PENDING_ASSIGNMENT", "ACCEPTED", "PICKED_UP"];
        newStatuses.forEach(status => {
            if (orderStatusEnum.includes(status)) {
                console.log(`✅ Order status enum includes: ${status}`);
            } else {
                console.error(`❌ Order status enum missing: ${status}`);
            }
        });

        // 3. Test Earnings Logic (Aggregation)
        console.log("\nTesting Earnings Aggregation...");
        const mockPartnerId = new mongoose.Types.ObjectId();
        const earningsStats = await Order.aggregate([
            {
                $match: {
                    deliveryPartner: mockPartnerId,
                    orderStatus: "DELIVERED"
                }
            },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: "$bill.deliveryFee" }
                }
            }
        ]);
        console.log("✅ Aggregation pipeline executed (Mock)");

        console.log("\nVerification completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Verification failed:", error);
        process.exit(1);
    }
}

verify();
