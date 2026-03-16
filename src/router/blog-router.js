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
import { authenticate, authorizeRole } from "../middlewares/autheticate.js"; // ✅ Updated import
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
// Public Routes (no auth needed)
// ─────────────────────────────────────────────
router.get("/public",          validate(getBlogsQuerySchema),  getPublicBlogs);
router.get("/public/:slug",    validate(getBlogBySlugSchema),  getBlogBySlug);

// ─────────────────────────────────────────────
// Protected Routes (auth + role required)
// ─────────────────────────────────────────────

// ✅ Both SUPER_ADMIN and BLOG_MANAGER can view all blogs
router.get("/",                
  authenticate, 
  authorizeRole("SUPER_ADMIN", "BLOG_MANAGER"),
  validate(getBlogsQuerySchema),  
  getAllBlogs
);

// ✅ Both can get blog by ID
router.get("/:id",             
  authenticate, 
  authorizeRole("SUPER_ADMIN", "BLOG_MANAGER"),
  validate(getBlogByIdSchema),    
  getBlogById
);

// ✅ Both can create blogs (owner will be set in controller)
router.post("/",               
  authenticate, 
  authorizeRole("SUPER_ADMIN", "BLOG_MANAGER"),
  uploadFields, 
  validate(createBlogSchema),  
  createBlog
);

// ✅ Both can update blogs (controller checks ownership for BLOG_MANAGER)
router.patch("/:id",           
  authenticate, 
  authorizeRole("SUPER_ADMIN", "BLOG_MANAGER"),
  uploadFields, 
  validate(updateBlogSchema),  
  updateBlog
);

// ✅ Both can delete blogs (controller checks ownership for BLOG_MANAGER)
router.delete("/:id",          
  authenticate, 
  authorizeRole("SUPER_ADMIN", "BLOG_MANAGER"),
  validate(deleteBlogSchema),               
  deleteBlog
);

export default router;