import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username cannot exceed 30 characters")
      .trim(),

    email: z
      .string()
      .email("Please provide a valid email address")
      .toLowerCase()
      .trim(),

    password: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Please provide a valid email address")
      .toLowerCase()
      .trim(),

    password: z
      .string()
      .min(1, "Password is required"),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Please provide a valid email address")
      .toLowerCase()
      .trim(),

    otp: z
      .string()
      .length(6, "OTP must be 6 digits")
      .regex(/^\d+$/, "OTP must contain only numbers"),
  }),
});

// Add to auth-validator.js
 
// ✅ Forgot Password Schema
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Please provide a valid email address")
      .toLowerCase()
      .trim(),
  }),
});
 
// ✅ Reset Password Schema (NO OTP - already verified)
export const resetPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Please provide a valid email address")
      .toLowerCase()
      .trim(),
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(50, "Password cannot exceed 50 characters"),
  }),
});