import { z } from "zod";

// Profile schemas
export const getProfileByUsernameSchema = z.object({
  username: z.string({ message: "Username is required" }),
});
export const updateProfileSchema = z
  .object({
    bio: z
      .string()
      .min(10, { message: "bio must be at least 10 characters long" })
      .max(100, { message: "bio must be at most 100 characters long" })
      .optional(),
    dob: z.date({ message: "Date of birth is required" }),
    location: z
      .string()
      .min(3, { message: "location must be at least 3 characters long" })
      .max(50, { message: "location must be at most 50 characters long" }),
    website: z
      .string()
      .regex(/^https?:\/\/.+/, { message: "Invalid URL format" }),
    countryCode: z.string().optional(),
    phoneNumber: z
      .string()
      .min(10, { message: "Phone cannot be less than 10" })
      .max(10, { message: "Phone cannot be more than 10" }),

    socialLinks: z.object({
      facebook: z
        .string()
        .regex(/^https?:\/\/.+/, { message: "Invalid URL format" })
        .optional(),
      twitter: z
        .string()
        .regex(/^https?:\/\/.+/, { message: "Invalid URL format" })
        .optional(),
      linkedIn: z
        .string()
        .regex(/^https?:\/\/.+/, { message: "Invalid URL format" })
        .optional(),
      github: z
        .string()
        .regex(/^https?:\/\/.+/, { message: "Invalid URL format" })
        .optional(),
    }),

    interests: z.array(z.string()),
  })
  .partial();

  
// export profile schemas types
export type GetProfileByUsernameType = z.infer<
  typeof getProfileByUsernameSchema
>;
export type UpdateProfileType = z.infer<typeof updateProfileSchema>;
