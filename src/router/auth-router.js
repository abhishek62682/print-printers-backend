/**
 * Authentication Routes
 *
 * LOGIN FLOW:
 * @route   POST /api/auth/register        - Register a new user
 * @route   POST /api/auth/login           - Verify credentials, generate OTP (logged to console)
 * @route   POST /api/auth/verify-otp      - Verify OTP → receive JWT
 *
 * FORGOT PASSWORD FLOW:
 * @route   POST /api/auth/forgot-password     - Verify email exists, generate OTP (logged to console)
 * @route   POST /api/auth/verify-reset-otp    - Verify OTP → unlock password reset (short-lived)
 * @route   POST /api/auth/reset-password      - Submit new password (requires verified reset token)
 */

import express from "express";
import speakeasy from "speakeasy";
import createError from "http-errors";
import User from "../model/user-model.js";
import validate from "../middlewares/validate.js";
import logActivity, { ACTIVITY_ACTIONS } from "../utils/log-activity.js";
import {
  loginSchema,
  registerSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth-validator.js";

const router = express.Router();

// ─────────────────────────────────────────────
// Shared OTP config — one place to change it all
// ─────────────────────────────────────────────
const OTP_CONFIG = {
  digits: 6,
  step: 30,  // must match authenticator apps (Google Authenticator, Authy etc.)
  window: 1, // allow ±1 step drift (±30s) to cover clock skew
};

/** Generates a TOTP token using the user's stored secret */
function generateOtp(authSecret) {
  return speakeasy.totp({
    secret: authSecret,
    encoding: "base32",
    digits: OTP_CONFIG.digits,
    step: OTP_CONFIG.step,
  });
}

/** Verifies a submitted OTP token against the user's stored secret */
function verifyOtp(authSecret, token) {
  return speakeasy.totp.verify({
    secret: authSecret,
    encoding: "base32",
    token: String(token).trim(),
    digits: OTP_CONFIG.digits,
    step: OTP_CONFIG.step,
    window: OTP_CONFIG.window,
  });
}

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
router.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(createError(409, "Email already registered"));
    }

    const secret = speakeasy.generateSecret({ length: 20 });

    const user = await User.create({
      username,
      email,
      password,
      isVerified: false,
      authSecret: secret.base32,
      role: "BLOG_MANAGER",
    });

    await logActivity({
      userId: user._id,
      action: ACTIVITY_ACTIONS.REGISTER,
      module: "AUTH",
      targetLabel: user.email,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      status: "SUCCESS",
    });

    res.status(201).json({
      success: true,
      message: "Registration successful. Please login to continue.",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role,
      },
    });
  } catch (err) {
    await logActivity({
      userId: null,
      action: ACTIVITY_ACTIONS.REGISTER,
      module: "AUTH",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      status: "FAILED",
    });
    next(err);
  }
});


router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      
      await logActivity({
        userId: null,
        action: ACTIVITY_ACTIONS.LOGIN_FAILED,
        module: "AUTH",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        status: "FAILED",
      });
      return next(createError(401, "Invalid credentials"));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {

      await logActivity({
        userId: user._id,
        action: ACTIVITY_ACTIONS.LOGIN_FAILED,
        module: "AUTH",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        status: "FAILED",
      });
      return next(createError(401, "Invalid credentials"));
    }

    
    await logActivity({
      userId: user._id,
      action: ACTIVITY_ACTIONS.OTP_SENT,
      module: "AUTH",
      targetLabel: user.email,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      status: "SUCCESS",
    });

    generateOtp(user.authSecret);


    res.status(200).json({
      success: true,
      message: "Credentials verified. OTP sent to your registered email.",
      data: null,
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    next(err);
  }
});

// ─────────────────────────────────────────────
// LOGIN — Step 2: verify OTP → issue JWT
// ─────────────────────────────────────────────
router.post("/verify-otp", validate(verifyOtpSchema), async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.authSecret) {
      await logActivity({
        userId: null,
        action: ACTIVITY_ACTIONS.OTP_FAILED,
        module: "AUTH",
        targetLabel: email, // ✅ add this
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        status: "FAILED",
      });

      return next(createError(400, "No OTP request found. Please login again."));
    }

    const isValid = verifyOtp(user.authSecret, otp);
    if (!isValid) {
      await logActivity({
        userId: user._id,
        action: ACTIVITY_ACTIONS.OTP_FAILED,
        module: "AUTH",
        targetLabel: user.email, // ✅ add this (or email)
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        status: "FAILED",
      });

      return next(createError(400, "Invalid or expired OTP. Please try again."));
    }

    user.isVerified = true;
    await user.save();

    // Better to log OTP verified separately
    await logActivity({
      userId: user._id,
      action: ACTIVITY_ACTIONS.OTP_VERIFIED,
      module: "AUTH",
      targetLabel: user.email,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      status: "SUCCESS",
    });

    const token = user.generateJWT();

    res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
      data: {
        token,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// FORGOT PASSWORD — Step 1: send reset OTP
// ─────────────────────────────────────────────
router.post("/forgot-password", validate(forgotPasswordSchema), async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // ✅ Log attempt even if user not found (security audit)
      await logActivity({
        userId: null,
        action: ACTIVITY_ACTIONS.PASSWORD_RESET_REQUESTED,
        module: "AUTH",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        status: "FAILED",
      });
      return res.status(200).json({
        success: true,
        message: "If this email is registered, an OTP has been sent.",
        data: null,
      });
    }

    // Mark that a password reset was initiated (sets expiresAt on the model)
    user.initiatePasswordReset();
    await user.save();

    // ✅ Log password reset OTP sent
    await logActivity({
      userId: user._id,
      action: ACTIVITY_ACTIONS.PASSWORD_RESET_OTP_SENT,
      module: "AUTH",
      targetLabel: user.email,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      status: "SUCCESS",
    });

    generateOtp(user.authSecret);
    

    res.status(200).json({
      success: true,
      message: "If this email is registered, an OTP has been sent.",
      data: null,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// FORGOT PASSWORD — Step 2: verify reset OTP
// ─────────────────────────────────────────────
router.post("/verify-reset-otp", validate(verifyOtpSchema), async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.authSecret) {
      await logActivity({
        userId: null,
        action: ACTIVITY_ACTIONS.PASSWORD_RESET_VERIFIED,
        module: "AUTH",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        status: "FAILED",
      });
      return next(createError(400, "No OTP request found. Please request a password reset again."));
    }

    if (!user.passwordResetExpiresAt) {
      await logActivity({
        userId: user._id,
        action: ACTIVITY_ACTIONS.PASSWORD_RESET_VERIFIED,
        module: "AUTH",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        status: "FAILED",
      });
      return next(createError(400, "Password reset not initiated. Please use /forgot-password first."));
    }

    if (new Date() > user.passwordResetExpiresAt) {
      await logActivity({
        userId: user._id,
        action: ACTIVITY_ACTIONS.PASSWORD_RESET_VERIFIED,
        module: "AUTH",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        status: "FAILED",
      });
      return next(createError(401, "Password reset request expired. Please request a new one."));
    }

    const isValid = verifyOtp(user.authSecret, otp);
    if (!isValid) {
      await logActivity({
        userId: user._id,
        action: ACTIVITY_ACTIONS.PASSWORD_RESET_VERIFIED,
        module: "AUTH",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        status: "FAILED",
      });
      return next(createError(400, "Invalid or expired OTP. Please try again."));
    }

    user.passwordResetVerified = true;
    await user.save();

    // ✅ Log successful password reset OTP verification
    await logActivity({
      userId: user._id,
      action: ACTIVITY_ACTIONS.PASSWORD_RESET_VERIFIED,
      module: "AUTH",
      targetLabel: user.email,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      status: "SUCCESS",
    });

    res.status(200).json({
      success: true,
      message: "OTP verified. You can now reset your password.",
      data: {
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// FORGOT PASSWORD — Step 3: set new password
// ─────────────────────────────────────────────
router.post("/reset-password", validate(resetPasswordSchema), async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      await logActivity({
        userId: null,
        action: ACTIVITY_ACTIONS.PASSWORD_RESET_COMPLETED,
        module: "AUTH",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        status: "FAILED",
      });
      return next(createError(404, "User not found"));
    }

    // isPasswordResetValid() should check: passwordResetVerified === true && not expired
    if (!user.isPasswordResetValid()) {
      await logActivity({
        userId: user._id,
        action: ACTIVITY_ACTIONS.PASSWORD_RESET_COMPLETED,
        module: "AUTH",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        status: "FAILED",
      });
      return next(
        createError(401, "Password reset not verified or expired. Please start over.")
      );
    }

    user.password = newPassword;
    user.clearPasswordReset(); // clears passwordResetVerified + passwordResetExpiresAt
    await user.save();

    // ✅ Log successful password reset
    await logActivity({
      userId: user._id,
      action: ACTIVITY_ACTIONS.PASSWORD_RESET_COMPLETED,
      module: "AUTH",
      targetLabel: user.email,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      status: "SUCCESS",
    });

    res.status(200).json({
      success: true,
      message: "Password reset successfully. Please login with your new password.",
      data: null,
    });
  } catch (err) {
    await logActivity({
      userId: null,
      action: ACTIVITY_ACTIONS.PASSWORD_RESET_COMPLETED,
      module: "AUTH",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      status: "FAILED",
    });
    next(err);
  }
});

export default router;