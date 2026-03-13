import express from "express";
import {
  createEnquiry,
  getAllEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
  exportEnquiries,           // ← new
} from "../controller/enquiry-controller.js";
import authenticate from "../middlewares/autheticate.js";
import validate from "../middlewares/validate.js";
import {
  createEnquirySchema,
  updateEnquirySchema,
  getEnquiriesQuerySchema,
  exportEnquiriesQuerySchema, // ← new
  enquiryParamsSchema,
} from "../validators/enquiry-validator.js";

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────
router.post("/", validate(createEnquirySchema), createEnquiry);

// ── Protected (admin only) ────────────────────────────────────────────────
// IMPORTANT: /export must be defined BEFORE /:id — otherwise Express
// will treat "export" as an :id param and hit the wrong route
router.get("/export", authenticate, validate(exportEnquiriesQuerySchema), exportEnquiries);

router.get("/",      authenticate, validate(getEnquiriesQuerySchema), getAllEnquiries);
router.get("/:id",   authenticate, validate(enquiryParamsSchema),     getEnquiryById);
router.patch("/:id", authenticate, validate(updateEnquirySchema),     updateEnquiry);
router.delete("/:id",authenticate, validate(enquiryParamsSchema),     deleteEnquiry);

export default router;