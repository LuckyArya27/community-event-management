import { apiRequest } from './client';

export function getEventReviews(eventId) {
  return apiRequest(`/events/${eventId}/reviews`);
}

export function createEventReview(eventId, rating, comment) {
  return apiRequest(`/events/${eventId}/reviews`, {
    method: 'POST',
    body: JSON.stringify({ rating, comment }),
  });
}

export function updateEventReview(id, rating, comment) {
  return apiRequest(`/event-reviews/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ rating, comment }),
  });
}

export function deleteEventReview(id) {
  return apiRequest(`/event-reviews/${id}`, {
    method: 'DELETE',
  });
}
