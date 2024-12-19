import morgan from "morgan";
import { logger } from "./winston.logger";

const stream = {
  /**
   * Writes a log message with http severity level.
   *
   * @param message - The message to be logged.
   */
  write: (message: string) => {
    // Log the message using the http severity level
    logger.http(message.trim());
  },
};

/**
 * Skips the logging of HTTP requests if the server was run in production mode.
 *
 * @returns {boolean} true if the server was run in production mode, false otherwise.
 */
const skip = () => {
  const env = process.env.NODE_ENV || "development";
  return env !== "development";
};

const morganMiddleware = morgan(
  ":remote-addr :method :url :status - :response-time ms",
  { stream, skip }
);

export { morganMiddleware };
