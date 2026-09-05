import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getEvent } from "../services/events";
import { cancelRegistration, eventRegistration, getMyRegistrations } from "../services/event-registrations";
import { createEventReview, deleteEventReview, getEventReviews, updateEventReview } from "../services/event-reviews";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { StatusBadge, CategoryTag } from "../components/ui/Badge";
import { ApiError } from "../services/client";
import { headerColor, formatDateLong } from "../utils/event-display";

function organizerLabel(event) {
  if (event.organizer_deleted || !event.organizer)  return 'Unavailable';
  return event.organizer.organization || event.organizer.user.name;
}

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [myRegistration, setMyRegistration] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionPending, setActionPending] = useState(false);

  const isParticipant = user?.role === 'participant';

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const eventData = await getEvent(id);
      setEvent(eventData);

      const isMasked = eventData.organizer_deleted || !eventData.organizer;
      const reviewData = await getEventReviews(id);
      setReviews(reviewData || []);
      
      if (isParticipant && !isMasked) {
        const registrations = await getMyRegistrations(id);
        const latest = (registrations || []).find(
          (registration) => String(registration.event_id ?? registration.event?.event_id) === String(id)
        ) || null;
        setMyRegistration(latest);
      } else { 
        setMyRegistration(null);
      }
    } catch(error) {
      setLoadError(error instanceof ApiError ? error.message : 'Could not load event details.');
    } finally {
      setLoading(false);
    }
  }, [id, isParticipant]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRegister() {
    setActionPending(true);
    setActionError('');
    try {
      await eventRegistration(id);
      await load();
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : 'Could not register for event.');
    } finally {
      setActionPending(false);
    }
  }

  async function handleCancel() {
    if (!myRegistration) return;
    setActionPending(true);
    setActionError('');
    try {
      await cancelRegistration(myRegistration.event_registration_id);
      await load();
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : 'Could not cancel registration.');
    } finally {
      setActionPending(false);
    }
  }

  async function handleReviewSubmit(e) {
    e.preventDefault();
    setReviewError('');
    setReviewSubmitting(true);
    try {
      if (editingReviewId) {
        await updateEventReview(editingReviewId, Number(rating), comment.trim());
      } else {
        await createEventReview(id, Number(rating), comment.trim());
      }
      const refreshedReviews = await getEventReviews(id);
      setReviews(refreshedReviews || []);
      setComment('');
      setEditingReviewId(null);
      setReviewOpen(false);
    } catch (error) {
      setReviewError(error instanceof ApiError ? error.message : 'Could not submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function handleReviewDelete(reviewId) {
    if (!window.confirm('Delete your review?')) return;
    setReviewError('');
    try {
      await deleteEventReview(reviewId);
      setReviews((current) => current.filter((review) => review.event_review_id !== reviewId));
    } catch (error) {
      setReviewError(error instanceof ApiError ? error.message : 'Could not delete review.');
    }
  }

  function openReviewForm(review = null) {
    setReviewError('');
    setEditingReviewId(review?.event_review_id || null);
    setRating(String(review?.rating || 5));
    setComment(review?.comment || '');
    setReviewOpen(true);
  }

  if (loading) {
    return (
      <div className='max-w-5xl mx-auto px-6 py-8'>
        <div className='h-48 bg-gray-100 rounded-card animate-pulse mb-6' />
        <div className='h-6 w-2/3 bg-gray-100 rounded-card animate-pulse mb-3' />
        <div className='h-4 w-1/3 bg-gray-100 rounded-card animate-pulse' />
      </div>
    );
  }

  if (loadError || !event) {
    return (
      <div className='max-w-5xl mx-auto px-6 py-8'>
        <div className='text-center py-16 bg-gray-50 rounded-card border border-gray-200'>
          <p className='text-lg font-medium text-slate-700 mb-1'>Could not load this event</p>
          <p className='text-sm text-slate-500 mb-4'>
            {loadError || 'This event may have been deleted or is unavailable.'}
          </p>
            <Link to='/' className='text-sm font-medium text-brand-600 hover:underline'>
              Return to Discovery
            </Link>
        </div>
      </div>
    );
  }

  const isMasked = event.organizer_deleted || !event.organizer;

  if (isMasked) {
    return (
      <div className='max-w-5xl mx-auto px-6 py-8'>
        <div className='text-center py-16 bg-gray-50 rounded-card border border-gray-200'>
          <p className='text-sm text-slate-500 mb-4'>
            The organizer of this event has been deleted, so the event details are no longer available.
          </p>
          <Link to='/' className='text-sm font-medium text-brand-600 hover:underline'>
            Return to Discover
          </Link>
        </div>
      </div>
    );
  }

  const registered = event.registered_count ?? 0;
  const percentFull = event.capacity ? Math.min((registered / event.capacity) * 100) : 0;
  const isCancelledEvent = event.status === 'cancelled';
  const canRegister = isParticipant && !myRegistration && event.status === 'open';
  const canCancel = isParticipant && myRegistration?.status === 'registered' && event.status !== 'completed';
  const canReview = isParticipant && myRegistration?.status === 'attended';
  
  return (
    <div className='max-w-5xl mx-auto px-6 py-8'>
      <Link to='/' className='text-sm text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 mb-4'>
        Back to Discover
      </Link>

      <Card className={`overflow-hidden mb-6 ${isCancelledEvent ? 'opacity-70' : ''}`}>
        <div className={`h-40 ${headerColor(event.category.name)} flex items-end px-6 py-4 relative`}>
          <span className='absolute top-4 right-4'>
            <StatusBadge status={event.status} />
          </span>
          <h1 className={`text-2xl font-bold text-white leading-tight ${isCancelledEvent ? 'line-through' : ''}`}>
            {event.title}
          </h1>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 p-6'>
          <div className='md:col-span-2 space-y-4'>
            <CategoryTag name={event.category.name} />

            <div className='text-sm text-slate-600 space-y-1'>
              <p><span className='font-medium'>Date:</span> {formatDateLong(event.event_date)}</p>
              {event.location && <p><span className='font-medium'>Location:</span> {event.location}</p>}
              <p className='text-slate-400'>
                Organized by{' '}
                <span className='text-slate-600'>{organizerLabel(event)}</span>
                {!event.organizer_deleted && event.organizer.user.email && (
                  <>
                    {' - '}
                    <p className='text-brand-600 hover:underline'>
                      {event.organizer.user.email}
                    </p>
                  </>
                )}
              </p>
            </div>

            {event.description && (
              <p className='text-sm text-slate-700 whitespace-pre-wrap leading-relaxed'>
                {event.description}
              </p>
            )}
          </div>

          <div className='space-y-4'>
            <div>
              <div className='flex justify-between text-xs text-slate-500 mb-1'>
                <span>Capacity</span>
                <span>{registered}/{event.capacity} registered</span>
              </div>
              <div className='h-1.5 bg-gray-100 rounded-full overflow-hidden'>
                <div className='h-full bg-brand-500' style={{ width: `${percentFull}%` }} />
              </div>
            </div>

            {actionError && (
              <div className='text-sm text-red-600 bg-red-50 border border-red-200 rounded-card px-3 py-2'>
                {actionError}
              </div>
            )}

            {!user ? (
              <Button className='w-full' onClick={(() => navigate('/login'))}>
                Log in to register
              </Button>
            ) : isParticipant ? (
              myRegistration?.status === 'registered' ? (
                <div className='space-y-2'>
                  <div className='text-sm text-brand-700 bg-brand-100 rounded-card px-3 py-2 text-center font-medium'>
                    You're registered for this event
                  </div>
                  {canCancel && (
                    <Button variant='danger' className='w-full' disabled={actionPending} onClick={handleCancel}>
                      {actionPending ? 'Cancelling...' : 'Cancel Registration'}
                    </Button>
                  )}
                </div>
              ) : canRegister ? (
                <Button className='w-full' disabled={actionPending} onClick={handleRegister}>
                  {actionPending ? 'Registering...' : 'Register'}
                </Button>
              ) : (
                <div 
                className='text-sm text-slate-500 bg-gray-50 border border-gray-200 rounded-card px-3 py-2 text-center'
                >{myRegistration?.status === 'attended' && 'You attended this event.'}
                {myRegistration?.status === 'no-show' && 'You were marked as a no-show.'}
                {event.status === 'cancelled' ? 'This event has been cancelled.' :
                myRegistration?.status === 'cancelled' ? 'Your registration was cancelled.' : ''}
                {!myRegistration && event.status === 'full' && 'This event is full.'}
                {!myRegistration?.status === 'attended' && event.status === 'closed' && 'Registration is closed.'}
                {event.status === 'completed' && 'This event has ended.'}
                </div>
              )
            ) : (
              <div className='text-sm text-slate-400 text-center'>
                Registration is only available for participants.
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className='p-6'>
        <div className='flex items-center justify-between gap-3 mb-4'>
          <h2 className='text-lg font-semibold text-slate-800'>Reviews</h2>
          {event.status === 'completed' && canReview && !reviewOpen && !reviews.some((review) => review.participant?.user?.user_id === user?.user_id) && (
            <Button onClick={() => openReviewForm()}>
              Add Review
            </Button>
          )}
        </div>

        {reviewOpen && (
          <form onSubmit={handleReviewSubmit} className='space-y-3 mb-5'>
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-1'>Rating</label>
              <select value={rating} onChange={(e) => setRating(e.target.value)} className='w-full border border-gray-300 rounded-card px-3 py-2 text-sm'>
                {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-1'>Comment</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className='w-full border border-gray-300 rounded-card px-3 py-2 text-sm' placeholder='Share your experience' />
            </div>
            {reviewError && <p className='text-sm text-red-600'>{reviewError}</p>}
            <div className='flex gap-2'>
              <Button type='submit' disabled={reviewSubmitting}>{reviewSubmitting ? 'Saving...' : editingReviewId ? 'Save Review' : 'Submit Review'}</Button>
              <Button type='button' variant='outline' onClick={() => { setReviewOpen(false); setEditingReviewId(null); }}>Cancel</Button>
            </div>
          </form>
        )}

        {reviews.length === 0 ? (
          <p className='text-sm text-slate-500'>No reviews yet.</p>
        ) : (
          <div className='space-y-3'>
            {reviews.map((review) => (
              <div key={review.event_review_id} className='border-t border-gray-100 pt-3'>
                {review.participant?.user?.user_id === user?.user_id ? (
                  <p className='text-sm font-medium text-brand-700'>My review</p>
                ) : (
                  <p className='text-sm font-medium text-slate-700'>
                    {review.participant?.user?.name || 'Participant'}
                    {review.participant?.institution && ` - ${review.participant.institution}`}
                    {user?.role === 'organizer' && review.participant?.user?.email && ` - ${review.participant.user.email}`}
                  </p>
                )}
                <p className='text-sm text-slate-600 mt-1'>{review.rating} / 5</p>
                {review.comment && <p className='text-sm text-slate-600 mt-1'>{review.comment}</p>}
                {canReview && review.participant?.user?.user_id === user?.user_id && !reviewOpen && (
                  <div className='flex gap-3 mt-2'>
                    <Button variant='ghost' className='px-0 border border-slate-300' onClick={() => openReviewForm(review)}>
                      Edit Review
                    </Button>
                    <Button variant='ghost' className='px-0 text-red-600 border border-red-300 hover:text-red-700' onClick={() => handleReviewDelete(review.event_review_id)}>
                      Delete Review
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
