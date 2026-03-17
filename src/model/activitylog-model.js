import { Schema, model } from "mongoose";

const activityLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    action: {
      type: String,
      enum: [
        "CREATE",
    "UPDATE",
    "DELETE",
    "VIEW",
    // Auth specific
    "REGISTER",
    "LOGIN",
    "LOGIN_FAILED",
    "LOGOUT",
    "OTP_SENT",
    "OTP_VERIFIED",
    "OTP_FAILED",
    "PASSWORD_RESET_REQUESTED",
    "PASSWORD_RESET_OTP_SENT",
    "PASSWORD_RESET_VERIFIED",
    "PASSWORD_RESET_COMPLETED",
      ],
      required: true,
      index: true,
    },

    module: {
      type: String,
      enum: [
        "BLOG",
        "TESTIMONIAL",
        "ENQUIRY",
        "USER",
        "PROFILE",
        "AUTH",
        "SETTINGS",
      ],
      required: true,
      index: true,
    },

    targetId: {
      type: Schema.Types.ObjectId,
      default: null,
    },

    targetLabel: {
      type: String,
      default: null,
    },

    message: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS",
    },

    ipAddress: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Useful indexes
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ module: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

const ActivityLog = model("ActivityLog", activityLogSchema);
export default ActivityLog;
