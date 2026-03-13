import { Router } from "express";
import { getStats } from "../controller/dashboard-controller.js";
import autheticate from "../middlewares/autheticate.js";

const dashboardRouter = Router();

dashboardRouter.get("/", autheticate, getStats);

export default dashboardRouter;