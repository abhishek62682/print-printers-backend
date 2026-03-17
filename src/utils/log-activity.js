import AuditLog from "../model/activitylog-model.js";

export const ACTIVITY_ACTIONS = {
  // Generic
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  VIEW: "VIEW",
  // Auth specific
  REGISTER: "REGISTER",
  LOGIN: "LOGIN",
  LOGIN_FAILED: "LOGIN_FAILED",
  LOGOUT: "LOGOUT",
  OTP_SENT: "OTP_SENT",
  OTP_VERIFIED: "OTP_VERIFIED",
  OTP_FAILED: "OTP_FAILED",
  PASSWORD_RESET_REQUESTED: "PASSWORD_RESET_REQUESTED",
  PASSWORD_RESET_OTP_SENT: "PASSWORD_RESET_OTP_SENT",
  PASSWORD_RESET_VERIFIED: "PASSWORD_RESET_VERIFIED",
  PASSWORD_RESET_COMPLETED: "PASSWORD_RESET_COMPLETED",
};

const generateMessage = (action, module, targetLabel, status) => {
  const actionMap = {
    // Generic
    CREATE: "created",
    UPDATE: "updated",
    DELETE: "deleted",
    VIEW: "viewed",
    // Auth specific
    REGISTER: "registered",
    LOGIN: "logged in",
    LOGIN_FAILED: "failed login",
    LOGOUT: "logged out",
    OTP_SENT: "OTP sent",
    OTP_VERIFIED: "OTP verified",
    OTP_FAILED: "OTP verification failed",
    PASSWORD_RESET_REQUESTED: "requested password reset",
    PASSWORD_RESET_OTP_SENT: "password reset OTP sent",
    PASSWORD_RESET_VERIFIED: "password reset OTP verified",
    PASSWORD_RESET_COMPLETED: "password reset completed",
  };

  const moduleMap = {
    BLOG: "blog",
    ENQUIRY: "enquiry",
    TESTIMONIAL: "testimonial",
    USER: "user",
    PROFILE: "profile",
    AUTH: "account",
    SETTINGS: "settings",
  };

  const actionText = actionMap[action] || action.toLowerCase();
  const moduleText = moduleMap[module] || module.toLowerCase();

  // Auth-specific messages
  if (action === "LOGIN") return "Logged in successfully";
  if (action === "LOGIN_FAILED") return "Failed login attempt";
  if (action === "LOGOUT") return "Logged out";
  if (action === "REGISTER") return "Registered successfully";
  if (action === "OTP_SENT") return "OTP sent successfully";
  if (action === "OTP_VERIFIED") return "OTP verified, logged in";
  if (action === "OTP_FAILED") return "Failed OTP verification";
  if (action === "PASSWORD_RESET_REQUESTED") return "Password reset requested";
  if (action === "PASSWORD_RESET_OTP_SENT") return "Password reset OTP sent";
  if (action === "PASSWORD_RESET_VERIFIED") return "Password reset OTP verified";
  if (action === "PASSWORD_RESET_COMPLETED") return "Password changed successfully";

  // Generic actions with target label
  if (targetLabel) {
    return `${actionText} ${moduleText} "${targetLabel}"`;
  }

  return `${actionText} ${moduleText}`;
};

/**
 * Log Audit Activity
 */
export const logActivity = async (auditData) => {
  try {
    // ✅ Generate message
    const message = generateMessage(
      auditData.action,
      auditData.module,
      auditData.targetLabel,
      auditData.status
    );

    const audit = await AuditLog.create({
      userId: auditData.userId,
      action: auditData.action,
      module: auditData.module,
      targetId: auditData.targetId || null,
      targetLabel: auditData.targetLabel || null,
      message,
      status: auditData.status || "SUCCESS",
      ipAddress: auditData.ipAddress || null,
      userAgent: auditData.userAgent || null,
    });

    return audit;
  } catch (err) {
    console.error("Error logging activity:", err.message);
  }
};

export default logActivity;