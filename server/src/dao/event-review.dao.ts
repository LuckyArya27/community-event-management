import { AppDataSource } from '../config/data-source';
import { EventReview } from '../entities/event-review.entity';

const reviewRepository = AppDataSource.getRepository(EventReview);

async function findByEventAndParticipant(event_id: string, participant_id: string): Promise<EventReview | null> {
  return await reviewRepository.findOne({
    where: {
      event: { event_id },
      participant: { user_id: participant_id }
    }
  });
}

async function findByEvent(event_id: string): Promise<EventReview[]> {
  return await reviewRepository
    .createQueryBuilder('review')
    .leftJoin('review.event', 'event')
    .leftJoinAndSelect('review.participant', 'participant')
    .leftJoinAndSelect('participant.user', 'user')
    .select([
      'review.event_review_id',
      'review.rating',
      'review.comment',
      'review.created_at',
      'participant.user_id',
      'participant.institution',
      'user.user_id',
      'user.name',
      'user.email',
      'user.role'
    ])
    .where('event.event_id = :event_id', { event_id })
    .getMany();
}

async function findById(event_review_id: string): Promise<EventReview | null> {
  return await reviewRepository
    .createQueryBuilder('review')
    .leftJoin('review.event', 'event')
    .leftJoinAndSelect('review.participant', 'participant')
    .leftJoin('participant.user', 'user')
    .addSelect(['user.name', 'user.email', 'user.role'])
    .where('review.event_review_id = :event_review_id', { event_review_id })
    .getOne();
}

async function createReview(
  event_id: string,
  participant_id: string,
  data: { rating: number, comment?: string }
): Promise<EventReview> {
  const review = reviewRepository.create({
    event: { event_id },
    participant: { user_id: participant_id },
    ...data
  });
  return await reviewRepository.save(review);
}

async function updateReview(review: EventReview, data: Partial<EventReview>): Promise<EventReview> {
  reviewRepository.merge(review, data);
  return await reviewRepository.save(review);
}

async function deleteReview(review: EventReview): Promise<void> {
  await reviewRepository.remove(review);
}

export {
  findByEventAndParticipant,
  findByEvent,
  findById,
  createReview,
  updateReview,
  deleteReview
};