import mongoose, { Schema, Document } from "mongoose";
import { USER_TEMPORARY_TOKEN_EXPIRY, UserRolesEnum } from "@/constants";
import jwt from "jsonwebtoken";

export interface IUser extends Document {
  avatar: string;
  username: string;
  fullName: string;
  email: string;
  password: string;
  role: UserRolesEnum;
  isEmailVerified: boolean;
  refreshToken: string;
  forgotPasswordToken: string;
  forgotPasswordTokenExpiry: Date;
  emailVerificationToken: string;
  emailVerificationTokenExpiry: Date;
}

const userSchema: Schema<IUser> = new Schema<IUser>(
  {
    avatar: {
      type: String,
      default:
        "https://i.pinimg.com/280x280_RS/77/0f/b7/770fb75f5e81e4c2dbe8934f246aeeab.jpg",
    },
    username: {
      type: String,
      required: [true, "username is required"],
      unique: [true, "username already exists"],
      trim: true,
      lowercase: true,
      index: true,
    },

    fullName: {
      type: String,
      required: [true, "fullName is required"],
      minlength: [4, "fullName must be at least 4 characters long"],
      maxlength: [20, "fullName must be at most 20 characters long"],
    },

    email: {
      type: String,
      required: [true, "email is required"],
      unique: [true, "email already exists"],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "email is invalid"],
      trim: true,
      lowercase: true,
      index: true,
    },

    password: {
      type: String,
      required: [true, "password is required"],
      minlength: [6, "password must be at least 6 characters long"],
    },

    role: {
      type: String,
      required: [true, "role is required"],
      enum: UserRolesEnum,
      default: UserRolesEnum.USER,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    refreshToken: String,
    forgotPasswordToken: String,
    forgotPasswordTokenExpiry: Date,
    emailVerificationToken: String,
    emailVerificationTokenExpiry: Date,
  },
  { timestamps: true }
);

// Save password before save user
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await Bun.password.hash(this.password, {
    algorithm: "bcrypt",
  });
  next();
});

/**
 * Checks if the provided password is correct for the user.
 *
 * @param {string} password - The password to be checked.
 * @returns {Promise<boolean>} true if the password is correct, false otherwise.
 */
userSchema.methods.isPasswordCorrect = async function (
  password: string
): Promise<boolean> {
  return await Bun.password.verify(this.password, password);
};

// Methods to generate access and refresh token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      fullName: this.fullName,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: process.env.ACCESS_TOKEN_SECRET_EXPIRES_IN }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: process.env.REFRESH_TOKEN_SECRET_EXPIRES_IN }
  );
};

/**
 * @description Method responsible for generating tokens for email verification, password reset etc.
 */
userSchema.methods.generateTemporaryToken = function (): {
  unHashedToken: string;
  hashedToken: string;
  tokenExpiry: number;
} {
  // This token should be client facing
  // for example: for email verification unHashedToken should go into the user's mail
  const unHashedToken = Bun.randomUUIDv7();

  // This should stay in the DB to compare at the time of verification
  const hashedToken = new Bun.CryptoHasher("sha256")
    .update(unHashedToken)
    .digest("hex");

  // This is the expiry time for the token (20 minutes)
  const tokenExpiry = Date.now() + USER_TEMPORARY_TOKEN_EXPIRY;

  return { unHashedToken, hashedToken, tokenExpiry };
};
export const User = mongoose.model<IUser>("User", userSchema);
