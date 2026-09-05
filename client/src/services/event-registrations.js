import { apiRequest } from './client';

export function eventRegistration(eventId) {
  return apiRequest('/event-registrations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ eventId }),
  });
}

export function getMyRegistrations(eventId) {
  const qs = eventId ? `?eventId=${eventId}` : '';
  return apiRequest(`/event-registrations${qs}`);
}

export function getRegistrationById(registrationId) {
  return apiRequest(`/event-registrations/${registrationId}`);
}

export function cancelRegistration(registrationId) {
  return apiRequest(`/event-registrations/${registrationId}`, {
    method: 'DELETE',
  });
}
