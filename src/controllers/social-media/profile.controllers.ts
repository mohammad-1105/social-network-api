import mongoose from "mongoose";
import type { Request } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { Profile, type IProfile } from "@/models/social-media/profile.model";
import { User, type IUser } from "@/models/auth/user.model";
import { Follow } from "@/models/social-media/follow.model";
import {
  getProfileByUsernameSchema,
  updateProfileSchema,
  type GetProfileByUsernameType,
  type UpdateProfileType,
} from "@/schemas/social-media/profile.schemas";
import type { UploadApiResponse } from "cloudinary";
import { deleteFromCloudinary, uploadOnCloudinary } from "@/utils/cloudinary";

/**
 * Retrieves a user's profile along with additional account and follow information.
 *
 * @param {string} userId - The ID of the user whose profile is to be retrieved.
 * @param {Request} req - The HTTP request object, used to access the logged-in user's information.
 * @returns {Promise<object>} - A promise that resolves to an object containing the user's profile,
 *                              account details, follow counts, and a flag indicating if the logged-in
 *                              user is following the profile user.
 * @throws {ApiError} - If the user or user profile does not exist, or if any database operation fails.
 */

const getUserProfile = async (
  userId: string,
  req: Request
): Promise<object> => {
  // get the user
  const user: IUser | null = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User doesn't exists");
  }

  let profile = await Profile.aggregate([
    {
      $match: {
        profileOwner: new mongoose.Schema.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "profileOwner",
        foreignField: "_id",
        as: "account",
        pipeline: [
          {
            $project: {
              fullName: 1,
              avatar: 1,
              username: 1,
              email: 1,
              isEmailVerified: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "follows",
        localField: "profileOwner",
        foreignField: "followerId",
        as: "following", // users that are followed by current user
      },
    },
    {
      $lookup: {
        from: "follows",
        localField: "profileOwner",
        foreignField: "followeeId",
        as: "followedBy", // users that follow current user
      },
    },
    {
      $addFields: {
        account: { $first: "$account" },
        followingCount: { $size: "$following" },
        followedByCount: { $size: "$followedBy" },
      },
    },
    {
      $project: {
        following: 0,
        followedBy: 0,
      },
    },
  ]);

  let isFollowing = false;
  if (req.user?._id && req.user?._id?.toString() !== userId.toString()) {
    // Check if there is a logged in user and logged in user is NOT same as the profile that is being loaded
    // In such case we will check if the logged in user follows the loaded profile user
    const followInstance = await Follow.findOne({
      followerId: req.user?._id, // logged in user. If this is null `isFollowing` will be false
      followeeId: userId,
    });
    isFollowing = followInstance ? true : false;
  }
  const userProfile = profile[0];
  if (!userProfile) {
    throw new ApiError(404, "User profile does not exist");
  }
  return { ...userProfile, isFollowing };
};

const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await getUserProfile(req.user?._id.toString()!, req);

  return res
    .status(200)
    .json(new ApiResponse(200, "Profile fetched successfully", profile));
});

// public route
const getProfileByUsername = asyncHandler(async (req, res) => {
  const { username } = req.params as GetProfileByUsernameType;

  // validation with zod schema
  const result = getProfileByUsernameSchema.safeParse({ username });
  if (!result.success) {
    throw new ApiError(400, result.error.issues[0].message);
  }

  const user: IUser | null = await User.findOne({ username });

  if (!user) {
    throw new ApiError(404, "User doesn't exist");
  }

  const userProfile = await getUserProfile(user._id.toString(), req);

  return res
    .status(200)
    .json(new ApiResponse(200, "Profile fetched successfully", userProfile));
});

const updateProfile = asyncHandler(async (req, res) => {
  const {
    bio,
    dob,
    location,
    website,
    countryCode,
    phoneNumber,
    interests,
    socialLinks,
  }: UpdateProfileType = req.body;

  // validation with zod schema
  const result = updateProfileSchema.safeParse({
    bio,
    dob,
    location,
    website,
    countryCode,
    phoneNumber,
    interests,
    socialLinks,
  });
  if (!result.success) {
    throw new ApiError(400, result.error.issues[0].message);
  }

  let profile: IProfile | null = await Profile.findOneAndUpdate(
    {
      profileOwner: req.user?._id,
    },
    {
      $set: {
        bio,
        dob,
        location,
        website,
        countryCode,
        phoneNumber,
        interests,
        socialLinks,
      },
    },
    { new: true }
  );

  profile = (await getUserProfile(req.user?._id.toString()!, req)) as IProfile;

  return res
    .status(200)
    .json(new ApiResponse(200, "Profile updated successfully", profile));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  // Check if the file exists
  if (!req.file?.filename) {
    throw new ApiError(400, "No file uploaded, missing cover image");
  }

  // Get the user profile
  const profile: IProfile | null = await Profile.findOne({
    profileOwner: req.user?._id, // Provided by verifyJWT middleware
  });

  if (!profile) {
    throw new ApiError(404, "Profile does not exist");
  }

  // Delete the previous cover image from Cloudinary

  if (profile.coverImage.publicId) {
    await deleteFromCloudinary(profile.coverImage.publicId);
  }

  // Upload the new file to Cloudinary
  const result: UploadApiResponse | null = await uploadOnCloudinary(
    req.file.path
  );

  if (!result?.secure_url) {
    throw new ApiError(500, "Error uploading cover image");
  }

  // Update the profile with the new cover image
  profile.coverImage.url = result.secure_url ?? "";
  profile.coverImage.publicId = result.public_id ?? "";

  await profile.save({ validateBeforeSave: false });

  // Return a success response
  return res.status(200).json(
    new ApiResponse(200, "Cover image updated successfully", {
      coverImage: {
        url: result.secure_url,
      },
    })
  );
});

// export controllers
export { getMyProfile, getProfileByUsername, updateProfile, updateCoverImage };
