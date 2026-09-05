import { apiRequest } from './client';

export function searchEvents(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });

  const qs = query.toString();
  return apiRequest(`/events${qs ? `?${qs}` : ''}`);
}

export function getEvent(id) {
  return apiRequest(`/events/${id}`);
}

export function getMyEvents() {
  return apiRequest('/events/my-events');
}

export function getEventsOfDeletedOrganizer() {
  return apiRequest('/events/deleted-organizer-events');
}
export function createEvent(payload) {
  return apiRequest('/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateEvent(id, payload) {
  return apiRequest(`/events/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function updateEventStatus(id, status) {
  return apiRequest(`/events/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function deleteEvent(id) {
  return apiRequest(`/events/${id}`, {
    method: 'DELETE',
  });
}

export function getEventParticipants(id) {
  return apiRequest(`/events/${id}/participants`);
}

export function markAttendance(eventId, registrationId, attended) {
  return apiRequest(`/events/${eventId}/registrations/${registrationId}/attendance`, {
    method: 'PATCH',
    body: JSON.stringify({ attended }),
  });
}
