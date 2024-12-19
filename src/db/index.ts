import mongoose from "mongoose";
import { logger } from "@/logger/winston.logger";
import { DB_NAME } from "@/constants";

export let dbInstance: typeof mongoose | undefined = undefined;

export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    dbInstance = connectionInstance;
    logger.info(
      ` \n 🍀 MongoDB Connected 🍀 DB HOST : ${connectionInstance.connection.host}`
    );
  } catch (error: unknown) {
    logger.error(`MongoDB Connection Error: ${error}`);
    process.exit(1);
  }
};
