/**
 * Authentication Routes
 *
 * @route   POST /api/auth/register   - Register a new user
 * @route   POST /api/auth/login      - Login with email & password, sends OTP
 * @route   POST /api/auth/verify-otp - Verify OTP and receive JWT
 *
 * Note: Validation via Zod will be added later
 */

import express from "express";
import speakeasy from "speakeasy";
import createError from "http-errors";
import User from "../model/user-model.js";
import validate from "../middlewares/validate.js";
import { loginSchema, registerSchema, verifyOtpSchema } from "../validators/auth-validator.js";
import authenticate from "../middlewares/autheticate.js";
const router = express.Router();

router.post("/register", validate(registerSchema) ,async (req, res, next) => {
  try {
    console.log(req.body);
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(createError(409, "Email already registered"));
    }

    // Generate speakeasy secret once on registration — reused for every login OTP
    const secret = speakeasy.generateSecret({ length: 20 });

    const user = await User.create({
      username,
      email,
      password,
      isVerified: false,
      authSecret: secret.base32,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful. Please login to continue.",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/login",validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return next(createError(401, "Invalid credentials"));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(createError(401, "Invalid credentials"));
    }

    // ✅ Use permanent authSecret set at registration — no regeneration needed
    const otpCode = speakeasy.totp({
      secret: user.authSecret,
      encoding: "base32",
      digits: 6,
      step: 300, // 5 minute window
    });

    // TODO: Send otpCode via email/SMS in production
    // e.g. await sendEmail({ to: email, subject: "Your OTP", text: `Your OTP is ${otpCode}` })

    console.log(`[DEV ONLY] OTP for ${email}: ${otpCode}`); // remove in production

    res.status(200).json({
      success: true,
      message: "Credentials verified. OTP sent to your registered email.",
      data: null,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/verify-otp",  validate(verifyOtpSchema) ,async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    console.log(email, otp);

    const user = await User.findOne({ email });
    if (!user || !user.authSecret) {
      return next(
        createError(400, "No OTP request found. Please login again."),
      );
    }

    const isValid = speakeasy.totp.verify({
      secret: user.authSecret,
      encoding: "base32",
      token: String(otp).trim(),
      digits: 6,
      step: 30,
      window: 1,
    });

    if (!isValid) {
      return next(createError(400, "Invalid OTP. Please try again."));
    }

    // ✅ Keep authSecret intact — needed for every future login OTP
    user.isVerified = true;
    await user.save();

    const token = user.generateJWT();

    res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isVerified: user.isVerified,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("-password -authSecret");

    if (!user) {
      return next(createError(404, "User not found"));
    }

    res.status(200).json({
      success: true,
      message: "User details fetched successfully.",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    next(err);
  }
});


export default router;
