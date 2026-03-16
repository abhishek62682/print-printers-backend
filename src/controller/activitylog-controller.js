import createHttpError from "http-errors";
import AuditLog from "../model/activitylog-model.js";

// ─────────────────────────────────────────────
// GET /api/audit-logs
// Get all audit logs (SUPER_ADMIN only)
// ─────────────────────────────────────────────
const getAllAuditLogs = async (req, res, next) => {
  try {
    const page  = req.query.page  ?? 1;
    const limit = req.query.limit ?? 10;
    const skip  = (page - 1) * limit;

    const filter = {};

    // ✅ Filter by action type
    if (req.query.action) {
      filter.action = req.query.action;
    }

    // ✅ Filter by module
    if (req.query.module) {
      filter.module = req.query.module;
    }

    // ✅ Filter by status (SUCCESS or FAILED)
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // ✅ Search by target label or message
    if (req.query.search) {
      filter.$or = [
        { targetLabel: { $regex: req.query.search, $options: "i" } },
        { message: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("userId", "username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: "Audit logs fetched successfully.",
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages:  Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /api/audit-logs/my-logs
// Get current user's audit logs (via token)
// ─────────────────────────────────────────────
const getMyAuditLogs = async (req, res, next) => {
  try {
    const page  = req.query.page  ?? 1;
    const limit = req.query.limit ?? 10;
    const skip  = (page - 1) * limit;

    const filter = { userId: req.user._id }; // ✅ From auth token

    if (req.query.action) {
      filter.action = req.query.action;
    }

    if (req.query.module) {
      filter.module = req.query.module;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.search) {
      filter.$or = [
        { targetLabel: { $regex: req.query.search, $options: "i" } },
        { message: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: "Your audit logs fetched successfully.",
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages:  Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

export {
  getAllAuditLogs,
  getMyAuditLogs,
};