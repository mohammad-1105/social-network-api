import { User } from "@/models/auth/user.model";
import { ApiError } from "./ApiError";

/**
 * Generates an access token and a refresh token for a given user id
 *
 * @param {string} _id - The id of the user for whom the tokens are to be generated
 *
 * @returns {Promise<{accessToken: string, refreshToken: string}>} - A promise that resolves to an object containing the access token and the refresh token
 *
 * @throws {ApiError} - If the user with the given id is not found, or if an error occurs while generating the tokens
 */
export const generateAccessAndRefreshToken = async (
  _id: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  try {
    // Find the user by id
    const user = await User.findById(_id);
    if (!user) {
      throw new ApiError(404, "User not found while generating tokens");
    }
    // generate access and refresh tokens
    const accessToken = user?.generateAccessToken();
    const refreshToken = user?.generateRefreshToken();

    // attach refresh token to the user document to avoid refreshing the access token with multiple refresh tokens
    user.refreshToken = refreshToken;
    // save the user
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error: any) {
    throw new ApiError(
      500,
      error.message || "An error occurred while generating tokens"
    );
  }
};
