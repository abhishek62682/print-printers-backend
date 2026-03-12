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
import authenticate from "../middlewares/autheticate.js";
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

// Public
router.get("/public", getPublicTestimonials);
router.get("/", getAllTestimonials);

// Protected
router.post("/", authenticate, upload.single("image"), validate(createTestimonialSchema), createTestimonial);
router.patch("/:id", authenticate, upload.single("image"), validate(updateTestimonialSchema), updateTestimonial);
router.delete("/:id", authenticate, deleteTestimonial);

export default router;