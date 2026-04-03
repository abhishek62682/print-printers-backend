import createError from "http-errors";
import fs from "node:fs";
import User from "../model/user-model.js";
import logActivity from "../utils/log-activity.js";
import getClientIP from "../utils/getClientIP.js";

// ── Helper: delete old image from disk ────────────────────────────────────
const deleteImageFromDisk = (imagePath) => {
  if (!imagePath) return;
  fs.unlink(imagePath, (err) => {
    if (err) console.error(`[IMAGE DELETE ERROR]: ${err.message}`);
  });
};

// GET /api/profile
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req?.user?._id).select("-password -authSecret");
    if (!user) return next(createError(404, "User not found."));

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully.",
      data: {
        id:           user._id,
        username:     user.username,
        email:        user.email,
        profileImage: user.profileImage ?? null,
        isVerified:   user.isVerified,
        role:         user.role
      },
    });
  } catch (err) {
    await logActivity({
      userId: req.user._id,
      action: "READ",
      module: "PROFILE",
      ipAddress: getClientIP(req),
      userAgent: req.get("user-agent"),
      status: "FAILED",
    });
    next(err);
  }
};

// PATCH /api/profile
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req?.user?._id);
    if (!user) return next(createError(404, "User not found."));

    const { username } = req.body;
    const newImage = req.file ? req.file.path : undefined;

    if (newImage && user.profileImage) {
      deleteImageFromDisk(user.profileImage);
    }

    if (username)  user.username     = username;
    if (newImage)  user.profileImage = newImage;

    await user.save();

    await logActivity({
      userId: req.user._id,
      action: "UPDATE",
      module: "PROFILE",
      targetLabel: `username: ${user.username}`,
      ipAddress: getClientIP(req),
      userAgent: req.get("user-agent"),
      status: "SUCCESS",
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: {
        id:           user._id,
        username:     user.username,
        email:        user.email,
        profileImage: user.profileImage ?? null,
        isVerified:   user.isVerified,
        role:         user?.role
      },
    });
  } catch (err) {
    await logActivity({
      userId: req.user._id,
      action: "UPDATE",
      module: "PROFILE",
      ipAddress: getClientIP(req),
      userAgent: req.get("user-agent"),
      status: "FAILED",
    });
    next(err);
  }
};

// PATCH /api/profile/change-password
export const changePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return next(createError(404, "User not found."));

    const { currentPassword, newPassword } = req.body;

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      await logActivity({
        userId: req.user._id,
        action: "UPDATE",
        module: "PROFILE",
        targetLabel: "password-change",
        ipAddress: getClientIP(req),
        userAgent: req.get("user-agent"),
        status: "FAILED",
      });
      return next(createError(400, "Current password is incorrect."));
    }

    user.password = newPassword;
    await user.save();

    await logActivity({
      userId: req.user._id,
      action: "UPDATE",
      module: "PROFILE",
      targetLabel: "password-change",
      ipAddress: getClientIP(req),
      userAgent: req.get("user-agent"),
      status: "SUCCESS",
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
      data: null,
    });
  } catch (err) {
    await logActivity({
      userId: req.user._id,
      action: "UPDATE",
      module: "PROFILE",
      targetLabel: "password-change",
      ipAddress: getClientIP(req),
      userAgent: req.get("user-agent"),
      status: "FAILED",
    });
    next(err);
  }
};