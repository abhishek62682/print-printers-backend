import { HttpError } from "http-errors";
import { config } from "../config/config.js";

const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  const response = {
    message: err.message,
    errorStack: config.env === "development" ? err.stack : "",
  };

  if (err.fieldErrors) {
    response.fieldErrors = err.fieldErrors;
  }

  return res.status(statusCode).json(response);
};

export default globalErrorHandler;