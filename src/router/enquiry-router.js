import express from "express";
import {
  createRFP,
  getAllRFPs,
  getRFPById,
  updateRFP,
  deleteRFP,
  exportRFPs,
} from "../controller/rfp-controller.js";
import { authenticate, authorizeRole } from "../middlewares/autheticate.js";
import validate from "../middlewares/validate.js";
import {
  createRFPSchema,
  updateRFPSchema,
  getRFPsQuerySchema,
  exportRFPsQuerySchema,
  rfpParamsSchema,
} from "../validators/rfp-validator.js";

const router = express.Router();

// ── Public (no auth needed) ────────────────────────────────────────────────
router.post("/", validate(createRFPSchema), createRFP);

// ── SUPER_ADMIN only ───────────────────────────────────────────────────────

router.get(
  "/export",
  authenticate,
  authorizeRole("SUPER_ADMIN"),
  validate(exportRFPsQuerySchema),
  exportRFPs
);

router.get(
  "/",
  authenticate,
  authorizeRole("SUPER_ADMIN"),
  validate(getRFPsQuerySchema),
  getAllRFPs
);

router.get(
  "/:id",
  authenticate,
  authorizeRole("SUPER_ADMIN"),
  validate(rfpParamsSchema),
  getRFPById
);

router.patch(
  "/:id",
  authenticate,
  authorizeRole("SUPER_ADMIN"),
  validate(updateRFPSchema),
  updateRFP
);

router.delete(
  "/:id",
  authenticate,
  authorizeRole("SUPER_ADMIN"),
  validate(rfpParamsSchema),
  deleteRFP
);

export default router;