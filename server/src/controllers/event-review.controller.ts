import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { assertRole, assertOwnerOrRole } from "../middlewares/auth.middleware";
import * as reviewDAO from "../dao/event-review.dao";
import * as registrationDAO from "../dao/event-registration.dao";
import { InternalServerError, NotFoundError, UnauthorizedError, BadRequestError, ForbiddenError } from "../error-handling";

const getAllReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await reviewDAO.findByEvent(req.params.eventId as string);
    // console.log('Fetched reviews:', reviews); // Debugging line
    return res.status(StatusCodes.OK).json(reviews);
  } catch (error) {
    throw new InternalServerError('Failed to fetch reviews', 'FetchReviewsFailedException');
  }
};

const createReview = async (req: Request, res: Response) => {
  try {
    assertRole(req.user, 'participant');

    const attended = await registrationDAO.findByEventAndParticipantAndStatus(
      req.params.eventId as string,
      req.user!.user_id,
      'attended'
    );
    if (!attended) {
      throw new ForbiddenError('You can only review events you have attended', 'NotAttendedException');
    }

    const existingReview = await reviewDAO.findByEventAndParticipant(
      req.params.eventId as string,
      req.user!.user_id
    );
    if (existingReview) {
      throw new BadRequestError('You have already reviewed this event', 'ReviewAlreadyExistsException');
    }

    const { rating, comment } = req.body;
    const newReview = await reviewDAO.createReview(
      req.params.eventId as string,
      req.user!.user_id,
      { rating, comment }
    );

    return res.status(StatusCodes.CREATED).json(newReview);
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
    throw error;
    }
    throw new InternalServerError('Failed to create review', 'CreateReviewFailedException');
  }
};

const updateReview = async (req: Request, res: Response) => {
  try {
  const review = await reviewDAO.findById(req.params.reviewId as string);
  if (!review) {
    throw new NotFoundError('Review not found', 'ReviewNotFoundException');
  }
  assertOwnerOrRole(req.user, review.participant.user_id);

  const { rating, comment } = req.body;
  const updatedReview = await reviewDAO.updateReview(review, { rating, comment });

  return res.status(StatusCodes.OK).json(updatedReview);
} catch (error) {
  if (error instanceof Error && 'statusCode' in error) {
    throw error;
  }
  throw new InternalServerError('Failed to update review', 'UpdateReviewFailedException');
}
};

const deleteReview = async (req: Request, res: Response) => {
  try {
    const review = await reviewDAO.findById(req.params.reviewId as string);
    if (!review) {
      throw new NotFoundError('Review not found', 'ReviewNotFoundException');
    }
    assertOwnerOrRole(req.user, review.participant.user_id);

    await reviewDAO.deleteReview(review);
    return res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw new InternalServerError('Failed to delete review', 'DeleteReviewFailedException');
  }
};

export {
  getAllReviews,
  createReview,
  updateReview,
  deleteReview
};