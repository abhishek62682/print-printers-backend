import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticate, authorizeRole } from "../middlewares/autheticate.js"; // ✅ Updated import
import validate from "../middlewares/validate.js";
import { updateProfileSchema, changePasswordSchema } from "../validators/profile-validator.js";
import { getProfile, updateProfile, changePassword } from "../controller/profile-controller.js";

const router = express.Router();

// ── Multer setup — saves to uploads/profile/ ──────────────────────────────
fs.mkdirSync("uploads/profile", { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profile");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `profile-${uniqueSuffix}${ext}`);
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

// ── Routes (all authenticated users - both roles) ────────────────────────────────

// ✅ Get profile - all authenticated users
router.get(
  "/",                
  authenticate,
  authorizeRole("SUPER_ADMIN", "BLOG_MANAGER"),
  getProfile
);

// ✅ Update profile - all authenticated users
router.patch(
  "/",                
  authenticate, 
  authorizeRole("SUPER_ADMIN", "BLOG_MANAGER"),
  upload.single("profileImage"), 
  validate(updateProfileSchema),  
  updateProfile
);

// ✅ Change password - all authenticated users
router.patch(
  "/change-password", 
  authenticate, 
  authorizeRole("SUPER_ADMIN", "BLOG_MANAGER"),
  validate(changePasswordSchema), 
  changePassword
);

export default router;