import mongoose from "mongoose";



const enquirySchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },

    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },

    country: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    productType: {
      type: String,
      enum: ["Books", "Board Books", "Journals/Diaries", "Greeting Cards", "Packaging", "Other"],
      required: true,
    },

    bindingType: {
      type: String,
      enum: ["Paperback / Perfect Bound", "Hardcase", "Board Book", "Saddle Stitch", "Spiral/Wiro", "Not Sure"],
      required: true,
    },

    approximateQuantity: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    requiredDeliveryDate: {
      type: Date,
    },

    specialtyFinishing: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    projectDescription: {
      type: String,
      trim: true,
      maxlength: 3000,
    },

    howDidYouHear: {
  type: String,
  enum: [
    "Google Search",
    "Social Media",
    "Instagram",
    "Facebook",
    "LinkedIn",
    "Friend / Referral",
    "Existing Client",
    "WhatsApp",
    "Advertisement",
    "Other"
  ],
},

    status: {
      type: String,
      enum: ["new", "contacted", "quoted", "converted", "closed"],
      default: "new",
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

enquirySchema.index({ email: 1 });
enquirySchema.index({ status: 1 });
enquirySchema.index({ createdAt: -1 });

export default mongoose.model("Enquiry", enquirySchema);