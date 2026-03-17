import speakeasy from "speakeasy";
import User from "../model/user-model.js";
import  createError  from "http-errors";

// ✅ GET /users — list all users (SUPER_ADMIN only)
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user._id },                          
      email: { $ne: "print@printprinters.com" },           
    })
      .select("-password")
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

// ✅ POST /users — create a new user (SUPER_ADMIN only)
export const createUser = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(createError(409, "Email already registered"));
    }

    const secret = speakeasy.generateSecret({ length: 20 });

    const user = await User.create({
      username,
      email,
      password,
      role: role || "BLOG_MANAGER",
      isVerified: false,
      authSecret: secret.base32,
      createdBy: req.user._id, // set from auth middleware
    });

    res.status(201).json({
      success: true,
      message: "User created successfully.",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        createdBy: req.user._id,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ✅ PATCH /users/:id/role — change role (SUPER_ADMIN only)
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["SUPER_ADMIN", "BLOG_MANAGER"].includes(role)) {
      return next(createError(400, "Invalid role. Must be SUPER_ADMIN or BLOG_MANAGER"));
    }

    // Prevent SUPER_ADMIN from demoting themselves
    if (id === req.user._id.toString()) {
      return next(createError(403, "You cannot change your own role"));
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select("-password -authSecret");

    if (!user) {
      return next(createError(404, "User not found"));
    }

    res.status(200).json({
      success: true,
      message: `Role updated to ${role} successfully.`,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return next(createError(403, "You cannot delete your own account"));
    }

    const user = await User.findById(id);

    if (!user) {
      return next(createError(404, "User not found"));
    }

    if (user.isSystemUser) {
      return next(createError(403, "System users cannot be deleted"));
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: "User deleted successfully.",
      data: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};