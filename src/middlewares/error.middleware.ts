import mongoose from "mongoose";
import type { Request, Response, NextFunction } from "express";
import { logger } from "@/logger/winston.logger";
import { ApiError } from "@/utils/ApiError";

/**
 * Error-handling middleware for Express.
 *
 * @param err - The error that occurred (can be `ApiError` or a generic `Error`).
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The Express next function.
 */
const errorHandler = (
  err: ApiError | Error, // Robust typing for possible error inputs
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Declare error as the normalized error
  let error: ApiError;

  // Check if the error is already an instance of ApiError
  if (err instanceof ApiError) {
    error = err; // Directly use the provided ApiError instance
  } else {
    // Normalize the error into an ApiError instance
    const statusCode = err instanceof mongoose.Error ? 400 : 500; // Mongoose errors default to 400
    const message = err.message || "Something went wrong"; // Default message for unknown errors

    // Create a new ApiError for consistency
    error = new ApiError(statusCode, message, [], err.stack || "");
  }

  // Create the error response object
  const response = {
    statusCode: error.statusCode,
    message: error.message,
    success: false,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}), // Include stack trace in development
  };

  // Log the error details using Winston logger
  logger.error(`${error.message} - Status: ${error.statusCode}`);

  // Send the response to the client
  res.status(error.statusCode).json(response);
};

export { errorHandler };
