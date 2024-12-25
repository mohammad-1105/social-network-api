import fs from "node:fs";
import { logger } from "@/logger/winston.logger";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (
  localFilePath: string
): Promise<UploadApiResponse | null> => {
  try {
    if (!localFilePath) return null;

    const result: UploadApiResponse = await cloudinary.uploader.upload(
      localFilePath,
      { resource_type: "auto" }
    );
    logger.info(`File has been uploaded : ${result}`);

    // If successfully uploaded then unlink the local file from the server
    fs.unlinkSync(localFilePath);
    return result;
  } catch (error) {
    logger.error(`Error in uploading file on cloudinary : ${error}`);
    // If failed to upload then unlink the file from the server
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export const deleteFromCloudinary = async (
  public_id: string | null
): Promise<boolean | null> => {
  if (!public_id) {
    return null;
  }
  try {
    const result = await cloudinary.uploader.destroy(public_id);
    logger.info(`File has been deleted : ${result}`);
    return true;
  } catch (error) {
    logger.error(`Error in deleting file from cloudinary : ${error}`);
    return false;
  }
};
