import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import authenticate from "../middlewares/autheticate.js";
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

// ── Routes (all protected) ────────────────────────────────────────────────
router.get(  "/",                authenticate,                                                    getProfile);
router.patch("/",                authenticate, upload.single("profileImage"), validate(updateProfileSchema),  updateProfile);
router.patch("/change-password", authenticate,                                validate(changePasswordSchema), changePassword);

export default router;