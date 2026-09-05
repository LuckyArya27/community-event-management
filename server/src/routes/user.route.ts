import express from "express";
const router = express.Router();

import {
  getUsersUsingQuery,
  getOneUserDetails,
  updateUserDetails,
  softDeleteUser,
  unBanUser,
  hardDeleteUser
} from "../controllers/user.controller";

router.get("/", getUsersUsingQuery);
router.get("/me", getOneUserDetails);
router.get("/:id", getOneUserDetails);
router.patch("/:id", updateUserDetails);
router.delete("/:id/soft-delete", softDeleteUser);
router.patch("/:id/unban", unBanUser);
router.delete("/:id/hard-delete", hardDeleteUser);

export default router;
