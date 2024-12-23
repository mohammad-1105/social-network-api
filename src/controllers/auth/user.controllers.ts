import jwt from "jsonwebtoken";
import { UserRolesEnum } from "@/constants";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { User, type IUser } from "@/models/auth/user.model";
import { generateAccessAndRefreshToken } from "@/utils/generateTokens";
import {
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  sendEmail,
} from "@/utils/mail";
import {
  forgotPasswordSchema,
  registerUserSchema,
  type LoginUserType,
  type RegisterUserType,
} from "@/schemas/auth/user.schema";
import { cookieOptions } from "@/utils/cookieOptions";

const registerUser = asyncHandler(async (req, res) => {
  // get the data from the request
  const { username, fullName, email, password, role }: RegisterUserType =
    req.body;

  // validation with zod schema
  const result = registerUserSchema.safeParse({
    username,
    fullName,
    email,
    password,
    role,
  });

  if (!result.success) {
    throw new ApiError(400, result.error.issues[0].message);
  }

  // check if the user already exists
  const existedUser: IUser | null = await User.findOne({ email });

  if (existedUser) {
    throw new ApiError(400, "User already exists");
  }

  // create a new user
  const newUser = (await User.create({
    username: username,
    fullName: fullName,
    email: email,
    isEmailVerified: false,
    password: password,
    role: role || UserRolesEnum.USER,
  })) as IUser;

  // generate a temporary token for the new user
  // the unhashed token is sent to the user's email
  // the hashed token is stored in the database
  // the tokenExpiry is the time when the token will expire
  const { hashedToken, unHashedToken, tokenExpiry } =
    newUser.generateTemporaryToken();

  newUser.emailVerificationToken = hashedToken;
  newUser.emailVerificationTokenExpiry = new Date(tokenExpiry);

  // save the user
  await newUser.save({ validateBeforeSave: false });

  // send email
  await sendEmail({
    email: newUser.email,
    subject: "Email Verification",
    productName: "Social Network API",
    productLink: `${req.protocol}://${req.get("host")}`,
    mailgenContent: emailVerificationMailgenContent(
      newUser.username,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
    ),
  });

  // get the created user
  const createdUser: IUser | null = await User.findById(newUser._id).select(
    "-password -refreshToken -forgotPasswordToken -forgotPasswordTokenExpiry -emailVerificationToken -emailVerificationTokenExpiry"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // send respose
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        "User registered successfully, Please check your email to verify",
        { user: createdUser }
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  // get the data from the request
  const { identifier, password }: LoginUserType = req.body;

  // validation with zod schema
  const result = registerUserSchema.safeParse({
    identifier,
    password,
  });

  if (!result.success) {
    throw new ApiError(400, result.error.issues[0].message);
  }

  // check if the user does not exist
  const user: IUser | null = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // check if the password is correct
  const isPasswordCorrect: boolean = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Password is incorrect");
  }

  // get the generated tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id.toString()
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, "User logged in successfully", {
        user: loggedInUser,
        accessToken,
        refreshToken,
      })
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user?._id, // this is accessible because of the verifyJWT middleware
    {
      $set: {
        refreshToken: null,
      },
    },
    { new: true }
  );

  // clear the cookies and send response
  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, "User logged out successfully", null));
});

const verifyEmail = asyncHandler(async (req, res) => {
  // get the email verification token
  const { verificationToken } = req.params;

  if (!verificationToken) {
    throw new ApiError(400, "Email Verification token is missing");
  }

  // if confuse why create hashedToken then visit @/models/auth/user.model.ts/userSchema.methods.generateTemporaryToken
  let hashedtoken = new Bun.CryptoHasher("sha256")
    .update(verificationToken)
    .digest("hex");

  const user: IUser | null = await User.findOne({
    emailVerificationToken: hashedtoken,
    emailVerificationTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(489, "Token is invalid or expired");
  }

  // update the user
  user.emailVerificationToken = null;
  user.emailVerificationTokenExpiry = null;

  // turn the isEmailVerified field to true
  user.isEmailVerified = true;
  await user.save({ validateBeforeSave: false });

  // send response

  return res
    .status(200)
    .json(new ApiResponse(200, "Email verified successfully", null));
});

/**
 * @description This controller is called when user is logged in and he has snackbar that your email is not verified
 * In case he did not get the email or the email verification token is expired
 * he will be able to resend the token while he is logged in
 */
const resendEmailVerification = asyncHandler(async (req, res) => {
  const user: IUser | null = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User doesn't exist");
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, "Email is already verified");
  }

  const { hashedToken, unHashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationTokenExpiry = new Date(tokenExpiry);

  await user.save({ validateBeforeSave: false });

  // send email

  await sendEmail({
    email: user.email,
    subject: "Email Verification",
    productName: "Social Network Api",
    productLink: `${req.protocol}://${req.get("host")}`,
    mailgenContent: emailVerificationMailgenContent(
      user.username,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
    ),
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Email verification link sent to your email", null)
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // get the refresh token from the cookies or the request body
  const incomingToken: string =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  // verify jwt token
  try {
    const decocedToken = jwt.verify(
      incomingToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as jwt.JwtPayload;

    const user: IUser | null = await User.findById(decocedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // match incomingToken to the user's refreshToken in the DB
    if (incomingToken !== user.refreshToken) {
      throw new ApiError(
        401,
        "Refresh token mismatch, May be expired to used !"
      );
    }

    // if match then update the refresh token and send the response
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id.toString()
    );

    // Update the user's refresh token in the database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(
        new ApiResponse(200, "Access token refreshed successfully", {
          accessToken,
          refreshAccessToken,
        })
      );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
  // get the email from the request body
  const { email } = req.body;

  // validation with zod schema
  const result = forgotPasswordSchema.safeParse({ email });

  if (!result.success) {
    throw new ApiError(400, result.error.issues[0].message);
  }

  // check if the user exists
  const user: IUser | null = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User with this email does not exist");
  }

  // generate token and send it to the user's email
  const { hashedToken, unHashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.forgotPasswordToken = hashedToken;
  user.forgotPasswordTokenExpiry = new Date(tokenExpiry);

  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user.email,
    subject: "Forgot password request",
    productName: "Social Network Api",
    productLink: `${req.protocol}://${req.get("host")}`,
    mailgenContent: forgotPasswordMailgenContent(
      user.username, // ! NOTE: Following link should be the link of the frontend page responsible to request password reset
      // ! Frontend will send the below token with the new password in the request body to the backend reset password endpoint
      `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`
    ),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Password reset mail sent to you email", null));
});

// export controllers
export {
  registerUser,
  loginUser,
  logoutUser,
  verifyEmail,
  resendEmailVerification,
  refreshAccessToken,
  forgotPasswordRequest
};
