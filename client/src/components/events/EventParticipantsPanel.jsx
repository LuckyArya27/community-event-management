import { useCallback, useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { RegistrationStatusBadge } from '../ui/Badge';
import { ApiError } from '../../services/client';
import { getEventParticipants, markAttendance } from '../../services/events';
import { getEventReviews } from '../../services/event-reviews';

export default function EventParticipantsPanel({ eventId, readOnly = false, section = 'participants' }) {
  const [participants, setParticipants] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [participantData, reviewData] = await Promise.all([
        getEventParticipants(eventId),
        getEventReviews(eventId)
      ]);
      setParticipants(participantData || []);
      setReviews(reviewData || []);
    } catch (error) {
      setError(error instanceof ApiError ? error.message : 'Could not load participants. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAttendance(registrationId, attended) {
    setUpdatingId(registrationId);
    try {
      await markAttendance(eventId, registrationId, attended);
      await load();
    } catch (error) {
      setError(error instanceof ApiError ? error.message : 'Could not update attendance. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading)  return <p className='text-sm text-slate-400 px-1 py-2'>Loading participants...</p>
  if (error) return <p className='text-sm text-red-600 px-1 py-2'>{error}</p>
  return (
    <div className='divide-y divide-gray-100'>
      {section === 'participants' && (participants?.length > 0 ? participants.map((participant) => {
        const name = participant?.participant?.user?.name || 'Unknown';
        const email = participant?.participant?.user?.email;
        const institution = participant?.participant?.institution;

        return (
          <div key={participant.event_registration_id} 
            className='flex items-center justify-between py-2 px-1 text-sm gap-2'>
            <div className='min-w-0'>
              <p className='font-medium text-slate-700 truncate'>{name}</p>
              <p className='text-xs text-slate-400 truncate'>{[email, institution].filter(Boolean).join(' - ')}</p>
            </div>
            <div className='flex items-center gap-2 shrink-0'>
              <RegistrationStatusBadge status={participant.status} />
              {!readOnly && participant.status === 'registered' && (
                <>
                  <Button
                    variant='ghost'
                    className='text-xs px-2 py-1'
                    disabled={updatingId === participant.event_registration_id}
                    onClick={() => handleAttendance(participant.event_registration_id, true)}
                  >
                    Attended
                  </Button>
                  <Button
                    variant='ghost'
                    className='text-xs px-2 py-1'
                    disabled={updatingId === participant.event_registration_id}
                    onClick={() => handleAttendance(participant.event_registration_id, false)}
                  >
                    No-Show
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      }) : (
        <p className='text-sm text-slate-400 px-1 py-2'>No participants yet.</p>
      ))}

      {section === 'reviews' && <div className='pt-2'>
        <h4 className='text-sm font-semibold text-slate-700 mb-2'>Reviews</h4>
        {reviews.length === 0 ? (
          <p className='text-sm text-slate-400 px-1 py-2'>No reviews yet.</p>
        ) : (
          <div className='space-y-3'>
            {reviews.map((review) => (
              <div key={review.event_review_id} className='border-t border-gray-100 pt-2 px-1'>
                <p className='text-sm font-medium text-slate-700'>
                  {review.participant?.user?.name || 'Participant'}
                  {review.participant?.institution && ` - ${review.participant.institution}`}
                  {review.participant?.user?.email && ` - ${review.participant.user.email}`}
                </p>
                <p className='text-xs text-slate-500'>{review.rating} / 5</p>
                {review.comment && <p className='text-sm text-slate-600 mt-1'>{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>}
    </div>
  );
}