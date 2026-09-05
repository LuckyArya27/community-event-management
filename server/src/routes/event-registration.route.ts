import express from "express";
const router = express.Router();

import {
  createEventRegistration,
  getRegistrations,
  getRegistrationById,
  cancelRegistration
} from "../controllers/event-registration.controller";

router.post("/", createEventRegistration);
router.get("/", getRegistrations);
router.get("/:id", getRegistrationById);
router.delete("/:id", cancelRegistration);

export default router;