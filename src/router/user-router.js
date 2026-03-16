import { Router } from "express";
import {
  getAllUsers,
  createUser,
  updateUserRole,
  deleteUser,
} from "../controller/user-controller.js";
import { authenticate, authorizeRole } from "../middlewares/autheticate.js";
import  validate  from "../middlewares/validate.js";
import {
  createUserSchema,
  updateUserRoleSchema,
  deleteUserSchema,
} from "../validators/user-validator.js";

const router = Router();

// ─── All routes below require auth + SUPER_ADMIN role ─────────────────────

router.use(authenticate, authorizeRole("SUPER_ADMIN"));

// GET    /api/users          — list all users
router.get("/", getAllUsers);

// POST   /api/users          — create a new user
router.post("/", validate(createUserSchema), createUser);

// PATCH  /api/users/:id/role — change a user's role
router.patch("/:id/role", validate(updateUserRoleSchema), updateUserRole);

// DELETE /api/users/:id      — remove a user
router.delete("/:id", validate(deleteUserSchema), deleteUser);

export default router;