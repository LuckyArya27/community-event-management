import express from "express";
const router = express.Router();

import {
  getAllReviews,
  createReview,
  updateReview,
  deleteReview
} from "../controllers/event-review.controller";

router.get("/events/:eventId/reviews", getAllReviews);
router.post("/events/:eventId/reviews", createReview);
router.patch("/event-reviews/:reviewId", updateReview);
router.delete("/event-reviews/:reviewId", deleteReview);

export default router;