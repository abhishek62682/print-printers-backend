import { Schema, model } from "mongoose";
import slugify from "slugify";

const blogSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
    },

    excerpt: {
      type: String,
      trim: true,
    },

    coverImage: {
      type: String,
      default: null,
    },
    coverImageAlt: {
      type: String,
      trim: true,
      default: "",
    },

    bannerImage: {
      type: String,
      default: null,
    },
    bannerImageAlt: {
      type: String,
      trim: true,
      default: "",
    },

    seo: {
      metaTitle: {
        type: String,
        trim: true,
        maxlength: [200, "Meta title cannot exceed 200 characters"],
      },
      metaDescription: {
        type: String,
        trim: true,
        maxlength: [400, "Meta description cannot exceed 400 characters"],
      },
      metaKeywords: {
        type: [String],
        default: [],
      },
      canonicalUrl: {
        type: String,
        trim: true,
        default: "",
      },
    },

    tags: {
      type: [String],
      default: [],
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "CreatedBy is required"],
    },

    authorName: {
  type: String,
  trim: true,
  default: "",
},

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

blogSchema.pre("save", async function () {
  if (this.isModified("title") || this.isNew) {
    this.slug = slugify(this.title, { lower: true, strict: true, trim: true });
  }
});

const Blog = model("Blog", blogSchema);
export default Blog;