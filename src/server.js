import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import restaurantRoutes from "./routes/restaurant.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import menuRoutes from "./routes/menu.routes.js";
import menuItemsRoutes from "./routes/menuItems.routes.js";
import addonRoutes from "./routes/addon.routes.js";
import cartRoutes from "./routes/cart.routes.js"
import addressRoutes from "./routes/address.routes.js";
import orderRoutes from "./routes/order.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import restaurantAdminRoutes from "./routes/restaurantAdmin.routes.js";
import deliveryPartnerRoutes from "./routes/deliveryPartner.routes.js";
import cmsRoutes from "./routes/cms.routes.js";
import searchRoutes from "./routes/search.routes.js";
import foodRoutes from "./routes/food.routes.js";
import { authMiddleware } from "./middlewares/auth.middleware.js";
import { authorize } from "./middlewares/role.middleware.js";

const app = express();

// Middlewares
const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/menu-items", menuItemsRoutes);
app.use("/api/addons", addonRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/restaurant-admin", restaurantAdminRoutes);
app.use(
  ["/api/delivery-partner", "/api/delivery_partner"],
  authMiddleware,
  authorize("delivery_partner"),
  deliveryPartnerRoutes
);
app.use("/api/cms", cmsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/food", foodRoutes);

app.get("/", (req, res) => {
  res.send("Toggy backend running with ES Modules 🚀");
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
