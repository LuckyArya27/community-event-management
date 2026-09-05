import express from "express";
const router = express.Router();

import {
  searchEvents,
  getEventById,
  getEventByOrganizer,
  getEventsOfDeletedOrganizer,
  createEvent,
  updateEvent,
  updateEventStatus,
  deleteEvent,
  getEventParticipants,
  markAttendance
} from "../controllers/event.controller";

router.get("/", searchEvents);
router.get("/my-events", getEventByOrganizer);
router.get("/deleted-organizer-events", getEventsOfDeletedOrganizer);
router.get("/:id", getEventById);
router.post("/", createEvent);
router.patch("/:id", updateEvent);
router.patch("/:id/status", updateEventStatus);
router.delete("/:id", deleteEvent);
router.get("/:id/participants", getEventParticipants );
router.patch("/:id/registrations/:registrationId/attendance", markAttendance);

export default router;