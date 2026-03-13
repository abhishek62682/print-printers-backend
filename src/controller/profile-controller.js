import createError from "http-errors";
import fs from "node:fs";
import User from "../model/user-model.js";

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
    const user = await User.findById(req.userId).select("-password -authSecret");
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
      },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/profile
// Updates username and/or profile image
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return next(createError(404, "User not found."));

    const { username } = req.body;
    const newImage = req.file ? req.file.path : undefined;

    // Delete old profile image from disk if a new one is uploaded
    if (newImage && user.profileImage) {
      deleteImageFromDisk(user.profileImage);
    }

    if (username)  user.username     = username;
    if (newImage)  user.profileImage = newImage;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: {
        id:           user._id,
        username:     user.username,
        email:        user.email,
        profileImage: user.profileImage ?? null,
        isVerified:   user.isVerified,
      },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/profile/change-password
export const changePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return next(createError(404, "User not found."));

    const { currentPassword, newPassword } = req.body;

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(createError(400, "Current password is incorrect."));
    }

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
      data: null,
    });
  } catch (err) {
    next(err);
  }
};