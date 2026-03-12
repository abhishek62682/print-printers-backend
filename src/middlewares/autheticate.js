import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";

const authenticate = (req, res, next) => {
  const tokenHeader = req.header("Authorization"); 
  if (!tokenHeader || !tokenHeader.startsWith("Bearer ")) {
    return next(createHttpError(401, "Authorization token is required."));
  }

  const token = tokenHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.userId = decoded.sub;
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

export default authenticate;