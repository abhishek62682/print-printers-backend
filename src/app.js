import express from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler.js";
import { config } from "./config/config.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRouter from "./router/user-router.js"
import testimonialRouter from "./router/testimonial-router.js"
import blogRouter from "./router/blog-router.js"
const app = express();
import enquiryRouter from "./router/enquiry-router.js"

const allowedOrigins = [
  process.env.FRONTEND_DOMAIN_LANDING,
  process.env.FRONTEND_DOMAIN_ADMIN
];


app.use(
  cors({
    origin:allowedOrigins,
    credentials: true, 
  })
);
app.use(express.json())
app.use(express.urlencoded({extended:true}));


app.use("/api/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/auth" , authRouter);
app.use("/api/testimonials" , testimonialRouter);
app.use("/api/blogs",       blogRouter);  

app.use("/api/enquiries",enquiryRouter);

app.use(globalErrorHandler)

app.get("/" , function (req,res){
    res.json({
        message:true
    })
}) 


export default app;

