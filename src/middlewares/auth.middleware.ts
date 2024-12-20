import type { UserRolesEnum } from "@/constants";
import { User, type IUser } from "@/models/auth/user.model";
import { ApiError } from "@/utils/ApiError";
import { asyncHandler } from "@/utils/asyncHandler";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  // Get the token from the cookies or header
  const token: string =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);

    if (typeof decodedToken === "object" && "_id" in decodedToken) {
      const user: IUser | null = await User.findById(decodedToken._id).select(
        "-password -refreshToken -forgotPasswordToken -forgotPasswordTokenExpiry -emailVerificationToken -emailVerificationTokenExpiry"
      );
      if (!user) {
        // Client should make a request to /api/v1/users/refresh-token if they have refreshToken present in their cookie
        // Then they will get a new access token which will allow them to refresh the access token without logging out the user
        throw new ApiError(401, "Invalid access token");
      }

      // Attach the user to the request object
      req.user = user;
      next();
    } else {
      throw new ApiError(401, "Invalid token");
    }
  } catch (error: any) {
    // Client should make a request to /api/v1/users/refresh-token if they have refreshToken present in their cookie
    // Then they will get a new access token which will allow them to refresh the access token without logging out the user
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

/**
 *
 * @description Middleware to check logged in users for unprotected routes. The function will set the logged in user to the request object and, if no user is logged in, it will silently fail.
 *
 * `NOTE: THIS MIDDLEWARE IS ONLY TO BE USED FOR UNPROTECTED ROUTES IN WHICH THE LOGGED IN USER'S INFORMATION IS NEEDED`
 */
export const getLoggedInUserOrIgnore = asyncHandler(async (req, res, next) => {
  const token: string =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);

    if (typeof decodedToken === "object" && "_id" in decodedToken) {
      const user: IUser = await User.findById(decodedToken._id).select(
        "-password -refreshToken -forgotPasswordToken -forgotPasswordTokenExpiry -emailVerificationToken -emailVerificationTokenExpiry"
      );
      req.user = user;
      next();
    }
  } catch (error) {
    // Fail silently with req.user being falsy
    next();
  }
});

/**
 * @param {UserRolesEnum[]} roles - Array of user roles that are allowed to access the route.
 * @description
 * This middleware validates multiple user role permissions at a time.
 * If the user's role matches any of the roles provided, access is granted.
 *
 * @example
 * // Restrict route to admins only
 * app.get(
 *   "/admin/dashboard",
 *   verifyPermission([UserRolesEnum.ADMIN]),
 *   (req, res) => {
 *     res.send("Welcome, Admin!");
 *   }
 * );
 *
 * @example
 * // Allow both ADMIN and USER roles to access
 * app.post(
 *   "/manage",
 *   verifyPermission([UserRolesEnum.ADMIN, UserRolesEnum.USER]),
 *   (req, res) => {
 *     res.send("Accessible to multiple roles!");
 *   }
 * );
 */
export const verifyPermission = (roles: UserRolesEnum[] = []) =>
  asyncHandler(async (req, res, next) => {
    if (!req.user?._id) {
      throw new ApiError(401, "Unauthorized request");
    }
    if (roles.includes(req.user?.role as UserRolesEnum)) {
      next();
    } else {
      throw new ApiError(403, "You are not allowed to perform this action");
    }
  });
