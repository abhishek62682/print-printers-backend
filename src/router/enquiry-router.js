import express from "express";
import {
  createEnquiry,
  getAllEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
} from "../controller/enquiry-controller.js";
import authenticate from "../middlewares/autheticate.js";
import validate from "../middlewares/validate.js";
import {
  createEnquirySchema,
  updateEnquirySchema,
  getEnquiriesQuerySchema,
  enquiryParamsSchema,
} from "../validators/enquiry-validator.js";

const router = express.Router();

// Public
router.post("/", validate(createEnquirySchema), createEnquiry);

// Protected (admin only)
router.get("/",    authenticate, validate(getEnquiriesQuerySchema), getAllEnquiries);
router.get("/:id", authenticate, validate(enquiryParamsSchema),     getEnquiryById);
router.patch("/:id", authenticate, validate(updateEnquirySchema),   updateEnquiry);
router.delete("/:id", authenticate, validate(enquiryParamsSchema),  deleteEnquiry);

export default router;