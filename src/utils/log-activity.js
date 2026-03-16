import AuditLog from "../model/activitylog-model.js";

/**
 * Generate user-friendly message based on action and module
 */
const generateMessage = (action, module, targetLabel, status) => {
  const actionMap = {
    CREATE: "created",
    UPDATE: "updated",
    DELETE: "deleted",
    LOGIN: "logged in",
    LOGOUT: "logged out",
    PROFILE_UPDATE: "updated profile",
    PASSWORD_CHANGE: "changed password",
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

  if (status === "FAILED") {
    if (action === "LOGIN") return "Failed login attempt";
    return `Failed to ${actionText} ${moduleText}`;
  }

  // Auth-related actions
  if (action === "LOGIN") return "Logged in successfully";
  if (action === "LOGOUT") return "Logged out";
  if (action === "PROFILE_UPDATE") return "Updated profile";
  if (action === "PASSWORD_CHANGE") return "Changed password";

  // Actions with target label
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
      message, // ✅ Use generated message
      status: auditData.status || "SUCCESS",
      ipAddress: auditData.ipAddress || null,
      userAgent: auditData.userAgent || null,
    });

    return audit;
  } catch (err) {
    console.error("Error logging activity:", err);
  }
};

export default logActivity;