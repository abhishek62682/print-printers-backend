import { z } from "zod";

export const createRFPSchema = z.object({
  body: z.object({

    recaptchaToken: z.string().min(1, "Security verification token is required"),

    fullName:      z.string().trim().min(2).max(100),
    companyName:   z.string().trim().min(2).max(150),
    email:         z.string().trim().toLowerCase().email().max(254),
    phone:         z.string().trim().min(7).max(20).regex(/^\+?[\d\s\-().]{7,20}$/, "Invalid phone number"),
    country:       z.string().trim().min(2).max(100),
    stateProvince: z.string().trim().min(1).max(100),
    city:          z.string().trim().min(1).max(100),
    zipCode:       z.string().trim().min(1).max(20),

    bookTitle:    z.string().trim().min(1).max(300),
    bookCategory: z.enum([
      "Religious & Faith Based Books",
      "Novels & Trade Books",
      "Children's Books & Board Books",
      "K-12 & Educational Books",
      "Coffee Table Books & Art Books",
      "Comic Books & Graphic Novels",
      "Cookbooks & Self-Learning Books",
      "Training & Guide Books",
      "Journals & Diaries",
      "Other",
    ]).optional(),
    trimSize:    z.string().trim().min(1).max(50).regex(
      /^\d+(\.\d+)?\s*[xX*×]\s*\d+(\.\d+)?(\s*(in|inch|inches))?$/,
      'Enter a valid trim size like "6 x 9" or "8.5 x 11"'
    ),
    orientation: z.enum(["Portrait", "Landscape", "Square"]),
    proofType:   z.enum(["Epsons", "PDFs", "Full Book Digitally Printed"]),

    bindingType: z.enum([
      "Softcover / Perfect Bound",
      "Hardcover / Case Bound",
      "Saddle Stitch",
      "Wire-O",
      "Lay Flat",
      "Coil / Spiral Binding",
      "Comb Binding",
      "Board Book",
      "Other",
    ]),
    bindingNotes:      z.string().trim().max(500).optional(),
    coverStock:        z.string().trim().min(1).max(300),
    coverInk:          z.enum(["4/0 CMYK", "1/0 Black", "4/0 CMYK + Varnish", "PMS", "Custom"]),
    coverLamination:   z.enum([
      "None",
      "Gloss Film Lamination",
      "Matte Film Lamination",
      "Soft Touch Lamination",
      "Scuff-free Matte Lamination",
      "Flood Aqeous Varnish",
      "Flood Matte Varnish",
    ]),
    boardCalliper:     z.string().trim().max(50).optional(),
    specialtyFinishes: z.string().trim().max(1000).optional(),
    dustJacket:        z.enum(["No", "Yes"]),

    dustJacketStock:      z.string().trim().max(200).optional(),
    dustJacketInk:        z.enum(["4/0 Process CMYK"]).optional(),
    dustJacketLamination: z.enum([
      "None",
      "Gloss Film Lamination",
      "Matte Film Lamination",
      "Soft Touch Lamination",
      "Scuff-free Matte Lamination",
      "Flood Aqeous Varnish",
      "Flood Matte Varnish",
    ]).optional(),
    dustJacketFinishes: z.string().trim().max(500).optional(),
    endsheetStock:      z.string().trim().max(200).optional(),
    endsheetPrinting:   z.enum(["Not Required", "1/1 Black", "4/4 Colour", "Custom"]).optional(),

    totalPages:     z.string().trim().min(1).max(50)
      .regex(/^\d+$/, "Must be a number")
      .refine(v => Number(v) > 0, "Must be greater than 0")
      .refine(v => Number(v) % 2 === 0, "Page count must be an even number"),
    textPaperStock: z.string().trim().min(1).max(300),
    textInk:        z.enum([
      "1/1 Black",
      "4/4 Process CMYK",
      "4/4 Process CMYK + Flood Varnish",
      "2/2 Process Colour",
    ]),

    quantities: z.array(z.coerce.number().int().min(1)).min(1).max(5),

    packingMethod: z.enum([
      "Individually Shrink-wrapped",
      "Multi Shrink-wrapped",
      "No Shrink-wrap",
    ]).optional(),
    shippingMethod: z.enum([
      "Door to Door (DDU)",
      "Ex-Works (India Factory/Warehouse)",
      "Customer Carrier",
    ]),
    deliveryAddress: z.string().trim().min(1).max(300),
    deliveryCity:    z.string().trim().min(1).max(150),
    deliveryCountry: z.string().trim().min(1).max(100),
    deliveryZip:     z.string().trim().min(1).max(20),

    specialInstructions: z.string().trim().max(3000).optional(),
    howDidYouHear: z.enum([
      "Google Search",
      "LinkedIn",
      "Referral from publisher",
      "Email Outreach",
      "Other",
    ]).optional(),

  }).superRefine((data, ctx) => {
    if (data.dustJacket === "Yes") {
      if (!data.dustJacketStock) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Dust jacket stock is required",      path: ["dustJacketStock"]      });
      }
      if (!data.dustJacketInk) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Dust jacket ink is required",        path: ["dustJacketInk"]        });
      }
      if (!data.dustJacketLamination) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Dust jacket lamination is required", path: ["dustJacketLamination"] });
      }
    }

    if (
      data.country.trim().toLowerCase() === "india" &&
      data.zipCode &&
      !/^\d{6}$/.test(data.zipCode.trim())
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indian PIN code must be exactly 6 digits",
        path: ["zipCode"],
      });
    }
  }),
});

export const updateRFPSchema = z.object({
  params: z.object({
    id: z.string().min(1, "RFP ID is required"),
  }),
  body: z.object({
    status: z.enum(["new", "contacted", "quoted", "converted", "closed"], {
      invalid_type_error: "Invalid status value",
    }).optional(),
    notes: z.string().trim().max(2000, "Notes must not exceed 2000 characters").optional(),
  }),
});

export const getRFPsQuerySchema = z.object({
  query: z
    .object({
      page: z
        .string().optional().default("1")
        .transform((val) => parseInt(val, 10))
        .pipe(z.number().int().min(1, { message: "Page must be at least 1" })),

      limit: z
        .string().optional().default("10")
        .transform((val) => parseInt(val, 10))
        .pipe(z.number().int().min(1).max(100)),

      country: z.string().trim().optional(),

      status: z.enum(["new", "contacted", "quoted", "converted", "closed"], {
        errorMap: () => ({ message: "Invalid status value" }),
      }).optional(),

      startDate: z
        .string().optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
          message: "startDate must be a valid date (e.g. 2025-01-01)",
        })
        .transform((val) => (val ? new Date(val) : undefined)),

      endDate: z
        .string().optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
          message: "endDate must be a valid date (e.g. 2025-03-31)",
        })
        .transform((val) =>
          val ? new Date(new Date(val).setHours(23, 59, 59, 999)) : undefined
        ),
    })
    .refine(
      (data) => {
        if (data.startDate && data.endDate) return data.startDate <= data.endDate;
        return true;
      },
      { message: "startDate must not be after endDate", path: ["startDate"] }
    ),
});

export const exportRFPsQuerySchema = z.object({
  query: z
    .object({
      country: z.string().trim().optional(),

      status: z.enum(["new", "contacted", "quoted", "converted", "closed"], {
        errorMap: () => ({ message: "Invalid status value" }),
      }).optional(),

      startDate: z
        .string().optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
          message: "startDate must be a valid date (e.g. 2025-01-01)",
        })
        .transform((val) => (val ? new Date(val) : undefined)),

      endDate: z
        .string().optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
          message: "endDate must be a valid date (e.g. 2025-03-31)",
        })
        .transform((val) =>
          val ? new Date(new Date(val).setHours(23, 59, 59, 999)) : undefined
        ),
    })
    .refine(
      (data) => {
        if (data.startDate && data.endDate) return data.startDate <= data.endDate;
        return true;
      },
      { message: "startDate must not be after endDate", path: ["startDate"] }
    ),
});

export const rfpParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, "RFP ID is required"),
  }),
});