import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

export const authMiddleware = async (req, res, next) => {
  try {
    console.log('🔐 Auth Middleware - Request:', {
      method: req.method,
      path: req.path,
      hasAuthHeader: !!req.headers.authorization
    });

    // 1️⃣ Check Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log('❌ Auth failed: No Bearer token');
      return res.status(401).json({ message: "Authorization token missing" });
    }

    // 2️⃣ Extract token
    const token = authHeader.split(" ")[1];
    console.log('🔑 Token extracted:', token ? `${token.substring(0, 20)}...` : 'NULL');

    // 3️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified, user ID:', decoded.id);

    // 4️⃣ Fetch user (exclude password explicitly)
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      console.log('❌ User not found in database:', decoded.id);
      return res.status(401).json({ message: "User not found" });
    }

    // 5️⃣ Blocked user check
    if (user.isBlocked) {
      console.log('❌ User is blocked:', user._id);
      return res.status(403).json({ message: "User account is blocked" });
    }

    // 6️⃣ Attach user to request (lighter object)
    req.user = {
      id: user._id,
      role: user.role,
    };
    console.log('✅ Auth successful, user attached:', req.user);
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    // Token expired vs invalid (clean UX)
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    return res.status(401).json({ message: "Invalid token" });
  }
};
