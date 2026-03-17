import express from "express";
import {
  createEnquiry,
  getAllEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
  exportEnquiries,
} from "../controller/enquiry-controller.js";
import { authenticate, authorizeRole } from "../middlewares/autheticate.js"; // ✅ Updated import
import validate from "../middlewares/validate.js";
import {
  createEnquirySchema,
  updateEnquirySchema,
  getEnquiriesQuerySchema,
  exportEnquiriesQuerySchema,
  enquiryParamsSchema,
} from "../validators/enquiry-validator.js";

const router = express.Router();

// ── Public (no auth needed) ────────────────────────────────────────────────
router.post("/", validate(createEnquirySchema), createEnquiry);


// ✅ Export enquiries - SUPER_ADMIN only
router.get(
  "/export", 
  authenticate, 
  authorizeRole("SUPER_ADMIN"),
  validate(exportEnquiriesQuerySchema), 
  exportEnquiries
);

// ✅ Get all enquiries - SUPER_ADMIN only
router.get(
  "/",      
  authenticate, 
  authorizeRole("SUPER_ADMIN"),
  validate(getEnquiriesQuerySchema), 
  getAllEnquiries
);

// ✅ Get enquiry by ID - SUPER_ADMIN only
router.get(
  "/:id",   
  authenticate, 
  authorizeRole("SUPER_ADMIN"),
  validate(enquiryParamsSchema),     
  getEnquiryById
);

// ✅ Update enquiry - SUPER_ADMIN only
router.patch(
  "/:id", 
  authenticate, 
  authorizeRole("SUPER_ADMIN"),
  validate(updateEnquirySchema),     
  updateEnquiry
);

// ✅ Delete enquiry - SUPER_ADMIN only
router.delete(
  "/:id",
  authenticate, 
  authorizeRole("SUPER_ADMIN"),
  validate(enquiryParamsSchema),     
  deleteEnquiry
);

export default router;