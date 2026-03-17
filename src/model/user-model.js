import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "BLOG_MANAGER"],
      default: "BLOG_MANAGER",
      required: [true, "Role is required"],
    },
    isSystemUser: { type: Boolean, default: false },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    authSecret: { type: String },
    isVerified: { type: Boolean, default: false },
    profileImage: { type: String, default: null },
    
    passwordResetVerified: {
      type: Boolean,
      default: false,
    },
    passwordResetExpiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);


userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateJWT = function () {
  return jwt.sign(
    { sub: this._id, email: this.email, role: this.role },
    config.jwtSecret || "secretkey",
    { expiresIn: "7d" }
  );
};


userSchema.methods.initiatePasswordReset = function () {
  this.passwordResetVerified = false;
  this.passwordResetExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
};


userSchema.methods.verifyPasswordReset = function () {
  if (new Date() > this.passwordResetExpiresAt) {
    return false; // Token expired
  }
  this.passwordResetVerified = true;
  return true;
};


userSchema.methods.isPasswordResetValid = function () {
  if (!this.passwordResetVerified) return false;
  if (new Date() > this.passwordResetExpiresAt) return false;
  return true;
};


userSchema.methods.clearPasswordReset = function () {
  this.passwordResetVerified = false;
  this.passwordResetExpiresAt = null;
};

const User = model("User", userSchema);
export default User;