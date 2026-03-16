import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import User from "../model/user-model.js";

const authenticate = async (req, res, next) => {
  const tokenHeader = req.header("Authorization"); 
  if (!tokenHeader || !tokenHeader.startsWith("Bearer ")) {
    return next(createHttpError(401, "Authorization token is required."));
  }

  const token = tokenHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);

    // ✅ Fetch full user object from database
    const user = await User.findById(decoded.sub).select("_id username email role");
    
    if (!user) {
      return next(createHttpError(401, "User not found."));
    }

    // ✅ Set req.user ONLY - single source of truth
    req.user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(createHttpError(401, "Token expired."));
    } else if (err.name === "JsonWebTokenError") {
      return next(createHttpError(401, "Invalid token."));
    } else {
      return next(createHttpError(401, "Authorization failed."));
    }
  }
};

const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user?.role) {
      return next(createHttpError(401, "User role not found."));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        createHttpError(
          403,
          `Access denied. Required role: ${allowedRoles.join(" or ")}`
        )
      );
    }

    next();
  };
};

export { authenticate, authorizeRole };