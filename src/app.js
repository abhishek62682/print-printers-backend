import express from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler.js";
import cors from "cors";
import path from "path";
import authRouter from "./router/auth-router.js"
import userRouter from "./router/user-router.js"
import dashboardRouter from "./router/dashboard-router.js";
import testimonialRouter from "./router/testimonial-router.js"
import activityRouter from "./router/activitylog-router.js"
import blogRouter from "./router/blog-router.js";
import cron from 'node-cron';
import { cleanupOldActivityLogs } from './cron/cleanupActivityLogs.js';
const app = express();
import enquiryRouter from "./router/enquiry-router.js"
import profileRouter from "./router/profile-router.js"
import { config } from "./config/config.js";
const allowedOrigins = [
  ...config.frontendDomainLanding,
  ...config.frontendDomainAdmin
];




app.use(
  cors({
    origin:allowedOrigins,
    credentials: true, 
  })
);
app.use(express.json())
app.use(express.urlencoded({extended:true}));

app.set("trust proxy", true);


app.use("/api/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/auth" , authRouter);
app.use("/api/users" , userRouter);
app.use("/api/testimonials" , testimonialRouter);
app.use("/api/blogs",       blogRouter);  
app.use("/api/profile" , profileRouter)
app.use("/api/request-quotes",enquiryRouter);
app.use("/api/audit-logs" ,activityRouter )

app.use("/api/dashboard", dashboardRouter )
app.use(globalErrorHandler);


cron.schedule('0 2 * * *', async () => {
  console.log('[Cron] Running activity log cleanup...');
  await cleanupOldActivityLogs();
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

app.get("/" , function (req,res){
    res.json({
        message:true
    })
}) 


export default app;

