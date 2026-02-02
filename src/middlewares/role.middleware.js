export const authorize = (...roles) => {
    return (req, res, next) => {
        // 1️⃣ Check if user exists on req (set by authMiddleware)
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found" });
        }

        // 2️⃣ Check if user role is included in allowed roles
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Forbidden: Access denied for ${req.user.role || "unknown"} role`,
            });
        }

        // 3️⃣ Authorized, proceed
        next();
    };
};
