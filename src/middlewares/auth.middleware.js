import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

export const authMiddleware = async (req, res, next) => {
  try {
    // 1️⃣ Check Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    // 2️⃣ Extract token
    const token = authHeader.split(" ")[1];

    // 3️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4️⃣ Fetch user (exclude password explicitly)
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // 5️⃣ Blocked user check
    if (user.isBlocked) {
      return res.status(403).json({ message: "User account is blocked" });
    }

    // 6️⃣ Attach user to request
    req.user = user;
    next();
  } catch (error) {
    // Token expired vs invalid (clean UX)
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    return res.status(401).json({ message: "Invalid token" });
  }
};
