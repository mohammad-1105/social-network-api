import { User } from "@/models/auth/user.model";
import { ApiError } from "./ApiError";

export const generateAccessAndRefreshToken = async (_id: string) => {
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

    return { accessToken, refreshToken };
  } catch (error: any) {
    throw new ApiError(
      500,
      error.message || "An error occurred while generating tokens"
    );
  }
};
