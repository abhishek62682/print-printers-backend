import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    username: z
      .string()
      .trim()
      .min(3, { message: "Username must be at least 3 characters" })
      .max(30, { message: "Username cannot exceed 30 characters" })
      .optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string()
      .min(6, { message: "Current password must be at least 6 characters" }),

    newPassword: z
      .string()
      .min(6, { message: "New password must be at least 6 characters" }),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  }),
});