import { z } from "zod";

export const createTestimonialSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name cannot exceed 100 characters")
      .trim(),

    designation: z
      .string()
      .min(1, "Designation is required")
      .max(100, "Designation cannot exceed 100 characters")
      .trim(),

    content: z
      .string()
      .min(1, "Content is required")
      .max(1000, "Content cannot exceed 1000 characters")
      .trim(),
  }),
});

export const updateTestimonialSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name cannot exceed 100 characters")
      .trim()
      .optional(),

    designation: z
      .string()
      .min(1, "Designation is required")
      .max(100, "Designation cannot exceed 100 characters")
      .trim()
      .optional(),

    content: z
      .string()
      .min(1, "Content is required")
      .max(1000, "Content cannot exceed 1000 characters")
      .trim()
      .optional(),

   
    isActive: z
      .enum(["true", "false"], { message: "isActive must be true or false" })
      .optional(),

   
    removeImage: z
      .enum(["true", "false"], { message: "removeImage must be true or false" })
      .optional(),
  }),

  params: z.object({
    id: z.string().min(1, "ID is required"),
  }),
});

export const getTestimonialsQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .default("1")
      .refine((val) => /^\d+$/.test(val), { message: "Page must be a positive number" })
      .transform(Number)
      .refine((val) => val >= 1, { message: "Page must be at least 1" }),

    limit: z
      .string()
      .optional()
      .default("10")
      .refine((val) => /^\d+$/.test(val), { message: "Limit must be a positive number" })
      .transform(Number)
      .refine((val) => val >= 1 && val <= 100, { message: "Limit must be between 1 and 100" }),

    status: z
      .enum(["active", "inactive"], { message: "Status must be 'active' or 'inactive'" })
      .optional(),
  }),
});