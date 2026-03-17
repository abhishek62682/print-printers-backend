import { z } from "zod";

export const createEnquirySchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(100),

    companyName: z.string().trim().min(2).max(150),

    email: z.string().trim().toLowerCase().email().max(254),

    phoneNumber: z
      .string({ required_error: "Phone number is required" })
      .trim()
      .min(7)
      .max(25)
      .regex(
        /^\+?[1-9]\d{0,3}[\s-]?\(?\d{2,4}\)?[\s-]?\d{2,4}[\s-]?\d{2,9}$/,
        "Invalid phone number"
      ),

    country: z.string().trim().min(2).max(100),

    productType: z.enum([
      "Books",
      "Board Books",
      "Journals/Diaries",
      "Greeting Cards",
      "Packaging",
      "Other",
    ]),

    bindingType: z.enum([
      "Paperback / Perfect Bound",
      "Hardcase",
      "Board Book",
      "Saddle Stitch",
      "Spiral/Wiro",
      "Not Sure",
    ]),

    approximateQuantity: z.string().trim().min(1).max(500),

    requiredDeliveryDate: z
      .string()
      .trim()
      .optional()
      .refine((date) => {
        if (!date) return true;
        const input = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        input.setHours(0, 0, 0, 0);
        return input > today;
      }, "Delivery date must be after today"),

    specialtyFinishing: z.string().trim().min(1).max(1000),

    projectDescription: z.string().trim().max(3000).optional(),

  howDidYouHear: z
      .enum([
        "Google Search",
        "Social Media",
        "Instagram",
        "Facebook",
        "LinkedIn",
        "Friend / Referral",
        "Existing Client",
        "WhatsApp",
        "Advertisement",
        "Other",
      ])
      .optional(),
  }),
});

export const updateEnquirySchema = z.object({
  params: z.object({
    id: z.string().min(1, "Enquiry ID is required"),
  }),
  body: z.object({
    status: z
      .enum(["new", "contacted", "quoted", "converted", "closed"], {
        invalid_type_error: "Invalid status value",
      })
      .optional(),
    notes: z
      .string()
      .trim()
      .max(2000, "Notes must not exceed 2000 characters")
      .optional(),
  }),
});

export const getEnquiriesQuerySchema = z.object({
  query: z
    .object({
      page: z
        .string()
        .optional()
        .default("1")
        .transform((val) => parseInt(val, 10))
        .pipe(z.number().int().min(1, { message: "Page must be at least 1" })),

      limit: z
        .string()
        .optional()
        .default("10")
        .transform((val) => parseInt(val, 10))
        .pipe(
          z
            .number()
            .int()
            .min(1, { message: "Limit must be at least 1" })
            .max(100, { message: "Limit must be at most 100" })  // ← clean 100 limit for list
        ),

      productType: z.string().trim().optional(),
      country:     z.string().trim().optional(),

      status: z
        .enum(["new", "contacted", "quoted", "converted", "closed"], {
          errorMap: () => ({ message: "Invalid status value" }),
        })
        .optional(),

      startDate: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
          message: "startDate must be a valid date (e.g. 2025-01-01)",
        })
        .transform((val) => (val ? new Date(val) : undefined)),

      endDate: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
          message: "endDate must be a valid date (e.g. 2025-03-31)",
        })
        .transform((val) =>
          val ? new Date(new Date(val).setHours(23, 59, 59, 999)) : undefined
        ),
    })
    .refine(
      (data) => {
        if (data.startDate && data.endDate) {
          return data.startDate <= data.endDate;
        }
        return true;
      },
      {
        message: "startDate must not be after endDate",
        path: ["startDate"],
      }
    ),
});

// ── Dedicated export schema — no pagination, only filters ─────────────────
export const exportEnquiriesQuerySchema = z.object({
  query: z
    .object({
      productType: z.string().trim().optional(),
      country:     z.string().trim().optional(),

      status: z
        .enum(["new", "contacted", "quoted", "converted", "closed"], {
          errorMap: () => ({ message: "Invalid status value" }),
        })
        .optional(),

      startDate: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
          message: "startDate must be a valid date (e.g. 2025-01-01)",
        })
        .transform((val) => (val ? new Date(val) : undefined)),

      endDate: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
          message: "endDate must be a valid date (e.g. 2025-03-31)",
        })
        .transform((val) =>
          val ? new Date(new Date(val).setHours(23, 59, 59, 999)) : undefined
        ),
    })
    .refine(
      (data) => {
        if (data.startDate && data.endDate) {
          return data.startDate <= data.endDate;
        }
        return true;
      },
      {
        message: "startDate must not be after endDate",
        path: ["startDate"],
      }
    ),
});

export const enquiryParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Enquiry ID is required"),
  }),
});