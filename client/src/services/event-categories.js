import { apiRequest } from './client';

export function getEventCategories() {
  return apiRequest('/event-categories');
}

export function createEventCategory(name) {
  return apiRequest('/event-categories', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function updateEventCategory(id, name) {
  return apiRequest(`/event-categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

export function deleteEventCategory(id) {
  return apiRequest(`/event-categories/${id}`, {
    method: 'DELETE',
  });
}
