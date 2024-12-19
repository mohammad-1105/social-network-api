import { connectDB } from "./db";
import { app } from "./app";
import { logger } from "./logger/winston.logger";

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8080, () => {
      logger.info(
        `🚀 Server started on port ${process.env.PORT || 8080} in ${process.env.NODE_ENV} mode`
      );
    });
  })
  .catch((err: unknown) => {
    logger.error(`Failed to start the server: ${err}`);
  });
