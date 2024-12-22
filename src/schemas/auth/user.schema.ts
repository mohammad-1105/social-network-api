import { UserRolesEnum } from "@/constants";
import { z } from "zod"


const emailSchema = z.string().email({ message: "Invalid email address" });
const usernameSchema = z.string()
    .min(1, { message: "username is required" })
    .max(20, { message: "username must be at most 20 characters long" })
    .toLowerCase()
    .trim();

export const userIdentifierSchema = z.object({
    identifier: z.union([emailSchema, usernameSchema])
        .refine(value => emailSchema.safeParse(value).success || usernameSchema.safeParse(value).success, {
            message: "Identifier must be a valid email or username"
        })
});


export const registerUserSchema = z.object({
    username: usernameSchema,

    fullName: z.string()
        .min(4, { message: "fullName must be at least 4 characters long" })
        .max(50, { message: "fullName must be at most 50 characters long" }),

    email: emailSchema,

    password: z.string().min(6, { message: "password must be at least 6 characters long" }),

    role: z.enum([UserRolesEnum.USER, UserRolesEnum.ADMIN])

});

export const loginUserSchema = z.object({
    identifier: userIdentifierSchema,
    password: z.string().min(6, { message: "password must be at least 6 characters long" })
})

export const changePasswordSchema = z.object({
    oldPassword: z.string().min(6, { message: "oldPassword must be at least 6 characters long" }),
    newPassword: z.string().min(6, { message: "newPassword must be at least 6 characters long" })
})

export const forgotPasswordSchema = z.object({
    email: emailSchema
})

export const resetPasswordSchema = z.object({
    password: z.string().min(6, { message: "password must be at least 6 characters long" }),

});


// Define TypeScript types from the schemas
export type RegisterUserType = z.infer<typeof registerUserSchema>;
export type LoginUserType = z.infer<typeof loginUserSchema>;
export type UserIdentifierType = z.infer<typeof userIdentifierSchema>;