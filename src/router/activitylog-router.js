import express from "express";
import { authenticate, authorizeRole } from "../middlewares/autheticate.js";
import {
  getAllAuditLogs,
  getMyAuditLogs,
} from "../controller/activitylog-controller.js";

const router = express.Router();

// ✅ Get my activity logs (via token)
// Query params: ?page=1&limit=10&action=CREATE&resourceType=BLOG&status=SUCCESS&search=test
router.get(
  "/my-logs",
  authenticate,
  authorizeRole("SUPER_ADMIN", "BLOG_MANAGER"),
 getMyAuditLogs
);

// ✅ Get all activity logs from all users (SUPER_ADMIN only)
// Query params: ?page=1&limit=10&username=john&role=BLOG_MANAGER&action=CREATE&search=test
router.get(
  "/",
  authenticate,
  authorizeRole("SUPER_ADMIN"),
  getAllAuditLogs
);

export default router;