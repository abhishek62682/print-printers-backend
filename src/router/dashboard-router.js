import { Router } from "express";
import { getStats } from "../controller/dashboard-controller.js";
import { authenticate, authorizeRole } from "../middlewares/autheticate.js"; // ✅ Updated import

const dashboardRouter = Router();

// ✅ Both SUPER_ADMIN and BLOG_MANAGER can view dashboard stats
dashboardRouter.get(
  "/", 
  authenticate, 
  authorizeRole("SUPER_ADMIN", "BLOG_MANAGER"),
  getStats
);

export default dashboardRouter;