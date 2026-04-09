import mongoose from "mongoose";

const requestQuoteSchema = new mongoose.Schema(
  {
    fullName: {
      type: String, required: true, trim: true,
      maxlength: 100,
    },
    companyName: {
      type: String, required: true, trim: true,
      maxlength: 150,
    },
    email: {
      type: String, required: true, trim: true, lowercase: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },
    phone: {
      type: String, required: true, trim: true,
      minlength: 7,
      maxlength: 20,
      match: [/^\+?[\d\s\-().]{7,20}$/, "Invalid phone number"],
    },
    country: {
      type: String, required: true, trim: true,
      maxlength: 100,
    },
    stateProvince: {
      type: String, required: true, trim: true,
      maxlength: 100,
    },
    city: {
      type: String, required: true, trim: true,
      maxlength: 100,
    },
    zipCode: {
      type: String, required: true, trim: true,
      maxlength: 20,
    },

    bookTitle: {
      type: String, required: true, trim: true,
      maxlength: 300,
    },
    bookCategory: {
      type: String, trim: true,
      enum: [
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
      ],
    },
    trimSize: {
      type: String, required: true, trim: true,
      maxlength: 50,
      match: [
        /^\d+(\.\d+)?\s*[xX*×]\s*\d+(\.\d+)?(\s*(in|inch|inches))?$/,
        'Invalid trim size format — use "6 x 9" or "8.5 x 11"',
      ],
    },
    orientation: {
      type: String, required: true, trim: true,
      enum: ["Portrait", "Landscape", "Square"],
    },
    proofType: {
      type: String, required: true, trim: true,
      enum: ["Epsons", "PDFs", "Full Book Digitally Printed"],
    },

    bindingType: {
      type: String, required: true, trim: true,
      enum: [
        "Softcover / Perfect Bound",
        "Hardcover / Case Bound",
        "Saddle Stitch",
        "Wire-O",
        "Lay Flat",
        "Coil / Spiral Binding",
        "Comb Binding",
        "Board Book",
        "Other",
      ],
    },
    bindingNotes: {
      type: String, trim: true,
      maxlength: 500,
    },
    coverStock: {
      type: String, required: true, trim: true,
      maxlength: 300,
    },
    coverInk: {
      type: String, required: true, trim: true,
      enum: ["4/0 CMYK", "1/0 Black", "4/0 CMYK + Varnish", "PMS", "Custom"],
    },
    coverLamination: {
      type: String, required: true, trim: true,
      enum: [
        "None",
        "Gloss Film Lamination",
        "Matte Film Lamination",
        "Soft Touch Lamination",
        "Scuff-free Matte Lamination",
        "Flood Aqeous Varnish",
        "Flood Matte Varnish",
      ],
    },
    boardCalliper: {
      type: String, trim: true,
      maxlength: 50,
    },
    specialtyFinishes: {
      type: String, trim: true,
      maxlength: 1000,
    },
    dustJacket: {
      type: String, required: true, trim: true,
      enum: ["No", "Yes"],
    },
    dustJacketStock: {
      type: String, trim: true,
      maxlength: 200,
      validate: {
        validator: function (val) {
          if (this.dustJacket === "Yes") return !!val && val.trim().length > 0;
          return true;
        },
        message: "Dust jacket stock is required when dust jacket is selected",
      },
    },
    dustJacketInk: {
      type: String, trim: true,
      enum: ["4/0 Process CMYK"],
      validate: {
        validator: function (val) {
          if (this.dustJacket === "Yes") return !!val && val.trim().length > 0;
          return true;
        },
        message: "Dust jacket ink is required when dust jacket is selected",
      },
    },
    dustJacketLamination: {
      type: String, trim: true,
      enum: [
        "None",
        "Gloss Film Lamination",
        "Matte Film Lamination",
        "Soft Touch Lamination",
        "Scuff-free Matte Lamination",
        "Flood Aqeous Varnish",
        "Flood Matte Varnish",
      ],
      validate: {
        validator: function (val) {
          if (this.dustJacket === "Yes") return !!val && val.trim().length > 0;
          return true;
        },
        message: "Dust jacket lamination is required when dust jacket is selected",
      },
    },
    dustJacketFinishes: {
      type: String, trim: true,
      maxlength: 500,
      validate: {
        validator: function (val) {
          if (this.dustJacket === "Yes" && val) return val.trim().length > 0;
          return true;
        },
        message: "Dust jacket finishes format is invalid",
      },
    },
    endsheetStock: {
      type: String, trim: true,
      maxlength: 200,
    },
    endsheetPrinting: {
      type: String, trim: true,
      enum: ["Not Required", "1/1 Black", "4/4 Colour", "Custom"],
    },

    totalPages: {
      type: String, required: true, trim: true,
      maxlength: 50,
      validate: {
        validator: (v) => /^\d+$/.test(v) && Number(v) > 0 && Number(v) % 2 === 0,
        message: "Page count must be a positive even number",
      },
    },
    textPaperStock: {
      type: String, required: true, trim: true,
      maxlength: 300,
    },
    textInk: {
      type: String, required: true, trim: true,
      enum: [
        "1/1 Black",
        "4/4 Process CMYK",
        "4/4 Process CMYK + Flood Varnish",
        "2/2 Process Colour",
      ],
    },

    quantities: {
      type: [Number],
      required: true,
      validate: [
        {
          validator: (arr) => arr.length >= 1,
          message: "At least 1 quantity is required",
        },
        {
          validator: (arr) => arr.length <= 5,
          message: "Maximum 5 quantities allowed",
        },
        {
          validator: (arr) =>
            arr.every((n) => Number.isFinite(n) && n >= 1 && Number.isInteger(n)),
          message: "Each quantity must be a positive integer",
        },
      ],
    },

    packingMethod: {
      type: String, trim: true,
      enum: ["Individually Shrink-wrapped", "Multi Shrink-wrapped", "No Shrink-wrap"],
    },
    shippingMethod: {
      type: String, required: true, trim: true,
      enum: [
        "Door to Door (DDU)",
        "Ex-Works (India Factory/Warehouse)",
        "Customer Carrier",
      ],
    },
    deliveryAddress: {
      type: String, required: true, trim: true,
      maxlength: 300,
    },
    deliveryCity: {
      type: String, required: true, trim: true,
      maxlength: 150,
    },
    deliveryCountry: {
      type: String, required: true, trim: true,
      maxlength: 100,
    },
    deliveryZip: {
      type: String, required: true, trim: true,
      maxlength: 20,
    },

    specialInstructions: {
      type: String, trim: true,
      maxlength: 3000,
    },
    howDidYouHear: {
      type: String, trim: true,
      enum: [
        "Google Search",
        "LinkedIn",
        "Referral from publisher",
        "Email Outreach",
        "Other",
      ],
    },

    status: {
  type: String,
  enum: [
    "New RFP",
    "Contacted",
    "Quote Prepared",
    "Quote Sent",
    "PO Received",
    "Pre-Press",
    "In Production",
    "In QC",
    "In Packaging",
    "Shipped & Completed",
  ],
  default: "New RFP",
},
    notes: {
      type: String, trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

requestQuoteSchema.index({ email: 1 });
requestQuoteSchema.index({ status: 1 });
requestQuoteSchema.index({ createdAt: -1 });

export default mongoose.model("RequestQuote", requestQuoteSchema);