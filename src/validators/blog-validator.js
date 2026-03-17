import { z } from "zod";

const tagsSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) && parsed.every((t) => typeof t === "string");
      } catch {
        return false;
      }
    },
    { message: "Tags must be a valid JSON array of strings e.g. '[\"tag1\",\"tag2\"]'" }
  );

const metaKeywordsSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) && parsed.every((k) => typeof k === "string");
      } catch {
        return false;
      }
    },
    { message: "Meta keywords must be a valid JSON array of strings e.g. '[\"keyword1\",\"keyword2\"]'" }
  );

// ✅ NEW: SEO Schema that handles string input (from FormData)
const seoSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      try {
        const parsed = JSON.parse(val);
        return typeof parsed === "object" && parsed !== null;
      } catch {
        return false;
      }
    },
    { message: "SEO must be a valid JSON object" }
  );

const slugParamSchema = z.object({
  slug: z.string().min(1, "Slug is required").trim(),
});

const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid blog ID"),
});

export const createBlogSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title cannot exceed 200 characters")
      .trim(),

    content: z.string().min(1, "Content is required").trim(),

    excerpt: z
      .string()
      .trim()
      .optional(),

    tags: tagsSchema,

    coverImageAlt: z
      .string()
      .trim()
      .optional(),

    bannerImageAlt: z
      .string()
      .trim()
      .optional(),

   
    seo: seoSchema,

    isActive: z
      .enum(["true", "false"], { message: "isActive must be 'true' or 'false'" })
      .optional(),
  }),
});

export const updateBlogSchema = z.object({
  params: idParamSchema,

  body: z
    .object({
      title: z
        .string()
        .min(1, "Title cannot be empty")
        .max(200, "Title cannot exceed 200 characters")
        .trim()
        .optional(),

      content: z.string().min(1, "Content cannot be empty").trim().optional(),

      excerpt: z
        .string()
        .max(300, "Excerpt cannot exceed 300 characters")
        .trim()
        .optional(),

      tags: tagsSchema,

      coverImageAlt: z
        .string()
        .trim()
        .optional(),

      bannerImageAlt: z
        .string()
        .trim()
        .optional(),

      // ✅ FIXED: seo is now a string that gets validated as JSON
      seo: seoSchema,

      isActive: z
        .enum(["true", "false"], { message: "isActive must be 'true' or 'false'" })
        .optional(),
    })
    .refine(
      (data) => Object.values(data).some((v) => v !== undefined),
      { message: "At least one field must be provided to update" }
    ),
});

export const deleteBlogSchema = z.object({
  params: idParamSchema,
});

export const getBlogByIdSchema = z.object({
  params: idParamSchema,
});

export const getBlogBySlugSchema = z.object({
  params: slugParamSchema,
});

export const getBlogsQuerySchema = z.object({
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

    tag: z.string().trim().optional(),

    search: z.string().trim().optional(),
  }),
});