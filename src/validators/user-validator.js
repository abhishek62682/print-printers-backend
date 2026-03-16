import { z } from "zod";

const userIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid user ID"),
});

export const createUserSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username cannot exceed 30 characters")
      .trim(),

    email: z
      .string()
      .email("Please provide a valid email address")
      .toLowerCase()
      .trim(),

    password: z
      .string()
      .min(6, "Password must be at least 6 characters"),

    role: z
      .enum(["SUPER_ADMIN", "BLOG_MANAGER"], {
        message: "Role must be SUPER_ADMIN or BLOG_MANAGER",
      })
      .default("BLOG_MANAGER")
      .optional(),
  }),
});

export const updateUserRoleSchema = z.object({
  params: userIdParamSchema,

  body: z.object({
    role: z.enum(["SUPER_ADMIN", "BLOG_MANAGER"], {
      message: "Role must be SUPER_ADMIN or BLOG_MANAGER",
    }),
  }),
});

export const deleteUserSchema = z.object({
  params: userIdParamSchema,
});