import mongoose from "mongoose";

const deliveryPartnerSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        vehicleNumber: {
            type: String,
            required: true,
            trim: true
        },
        isOnline: {
            type: Boolean,
            default: false
        },
        location: {
            lat: { type: Number },
            lng: { type: Number }
        },
        totalDeliveries: {
            type: Number,
            default: 0
        },
        totalEarnings: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

const DeliveryPartner = mongoose.model("DeliveryPartner", deliveryPartnerSchema);
export default DeliveryPartner;
