import { UserRolesEnum } from "@/constants";
import { z } from "zod";

const emailSchema = z
  .string({ message: "email is required" })
  .email({ message: "Invalid email address" });
const usernameSchema = z
  .string({ message: "username is required" })
  .min(3, { message: "username must be at least 3 character long" })
  .max(20, { message: "username must be at most 20 characters long" })
  .toLowerCase()
  .trim();

export const registerUserSchema = z.object({
  username: usernameSchema,

  fullName: z
    .string({ message: "fullName is required" })
    .min(4, { message: "fullName must be at least 4 characters long" })
    .max(50, { message: "fullName must be at most 50 characters long" }),

  email: emailSchema,

  password: z
    .string({ message: "password is required" })
    .min(6, { message: "password must be at least 6 characters long" }),

  role: z.enum([UserRolesEnum.USER, UserRolesEnum.ADMIN], {
    message: "Role is required and must be either USER or ADMIN",
  }),
});

export const userIdentifierSchema = z.union([emailSchema, usernameSchema]);

export const loginUserSchema = z.object({
  identifier: userIdentifierSchema,
  password: z
    .string({ message: "password is required" })
    .min(6, { message: "password must be at least 6 characters long" }),
});

export const changeCurrentPasswordSchema = z.object({
  currentPassword: z
    .string({ message: "current password is required" })
    .min(6, { message: "current password must be at least 6 characters long" }),
  newPassword: z
    .string({ message: "newPassword is required" })
    .min(6, { message: "newPassword must be at least 6 characters long" }),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetForgottenPasswordSchema = z.object({
  newPassword: z
    .string({ message: "New password is required" })
    .min(6, { message: "New password must be at least 6 characters long" }),
});

export const roleSchema = z.object({
  role: z.enum([UserRolesEnum.USER, UserRolesEnum.ADMIN], {
    message: "Role is required and must be either USER or ADMIN",
  }),
});

// Define TypeScript types from the schemas
export type RegisterUserType = z.infer<typeof registerUserSchema>;
export type LoginUserType = z.infer<typeof loginUserSchema>;
export type UserIdentifierType = z.infer<typeof userIdentifierSchema>;
export type ResetForgottenPasswordType = z.infer<
  typeof resetForgottenPasswordSchema
>;
export type ChangeCurrentPasswordType = z.infer<
  typeof changeCurrentPasswordSchema
>;
export type RoleType = z.infer<typeof roleSchema>;
