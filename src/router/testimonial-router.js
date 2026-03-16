import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  createTestimonial,
  getAllTestimonials,
  updateTestimonial,
  deleteTestimonial,
  getPublicTestimonials,
} from "../controller/testimonial-controller.js";
import { authenticate, authorizeRole } from "../middlewares/autheticate.js"; 
import { createTestimonialSchema, updateTestimonialSchema } from "../validators/testimonial-validator.js";
import validate from "../middlewares/validate.js";

const router = express.Router();

fs.mkdirSync("uploads/testimonials", { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/testimonials");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `testimonial-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error("Only jpeg, jpg, png, webp files are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
});

// ── Public (no auth needed) ────────────────────────────────────────────────
router.get("/public", getPublicTestimonials);

// ── Protected (SUPER_ADMIN only) ────────────────────────────────────────────

// ✅ Get all testimonials - SUPER_ADMIN only
router.get(
  "/", 
  authenticate, 
  authorizeRole("SUPER_ADMIN"),
  getAllTestimonials
);

// ✅ Create testimonial - SUPER_ADMIN only
router.post(
  "/", 
  authenticate, 
  authorizeRole("SUPER_ADMIN"),
  upload.single("image"), 
  validate(createTestimonialSchema), 
  createTestimonial
);

// ✅ Update testimonial - SUPER_ADMIN only
router.patch(
  "/:id", 
  authenticate, 
  authorizeRole("SUPER_ADMIN"),
  upload.single("image"), 
  validate(updateTestimonialSchema), 
  updateTestimonial
);

// ✅ Delete testimonial - SUPER_ADMIN only
router.delete(
  "/:id", 
  authenticate, 
  authorizeRole("SUPER_ADMIN"),
  deleteTestimonial
);

export default router;