import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
  getPublicBlogs,
} from "../controller/blog-controller.js";
import authenticate from "../middlewares/autheticate.js";
import validate from "../middlewares/validate.js";
import {
  createBlogSchema,
  updateBlogSchema,
  deleteBlogSchema,
  getBlogByIdSchema,
  getBlogBySlugSchema,
  getBlogsQuerySchema,
} from "../validators/blog-validator.js";

// ─────────────────────────────────────────────
// Multer Setup
// ─────────────────────────────────────────────
fs.mkdirSync("uploads/blogs", { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/blogs"),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  isValid
    ? cb(null, true)
    : cb(new Error("Only jpeg, jpg, png, webp files are allowed."), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

const uploadFields = upload.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "bannerImage", maxCount: 1 },
]);

const router = express.Router();

// ─────────────────────────────────────────────
// Public Routes
// ─────────────────────────────────────────────
router.get("/public",          validate(getBlogsQuerySchema),  getPublicBlogs);
router.get("/public/:slug",    validate(getBlogBySlugSchema),  getBlogBySlug);

// ─────────────────────────────────────────────
// Admin Routes (protected)
// ─────────────────────────────────────────────
router.get("/",                authenticate, validate(getBlogsQuerySchema),  getAllBlogs);
router.get("/:id",             authenticate, validate(getBlogByIdSchema),    getBlogById);
router.post("/",               authenticate, uploadFields, validate(createBlogSchema),  createBlog);
router.patch("/:id",           authenticate, uploadFields, validate(updateBlogSchema),  updateBlog);
router.delete("/:id",          authenticate, validate(deleteBlogSchema),               deleteBlog);

export default router;