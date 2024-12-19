import type { Request, Response, NextFunction } from "express";

type RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * Wraps an asynchronous Express request handler function and returns a new function
 * that handles any errors by passing them to the next middleware.
 *
 * @param {RequestHandler} fn - The asynchronous request handler.
 * @returns {(req: Request, res: Response, next: NextFunction) => void} - The wrapped function.
 */
export const asyncHandler = (
  fn: RequestHandler
): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};
