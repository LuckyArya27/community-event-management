import { apiRequest } from './client';

export function listUsers(role, createdAfter, createdBefore) {
  const queryParams = new URLSearchParams();
  if (role) queryParams.set('role', role);
  if (createdAfter) queryParams.set('created_after', createdAfter);
  if (createdBefore) queryParams.set('created_before', createdBefore);

  const qs = queryParams.toString();
  return apiRequest(`/users${qs ? `?${qs}` : ''}`);
}

export function getUser(id) {
  return apiRequest(`/users/${id}`);
}

export function updateUser(id, payload) {
  return apiRequest(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function softDeleteUser(id) {
  return apiRequest(`/users/${id}/soft-delete`, {
    method: 'DELETE',
  });
}

export function unbanUser(id) {
  return apiRequest(`/users/${id}/unban`, {
    method: 'PATCH',
  });
}

export function permanentDeleteUser(id) {
  return apiRequest(`/users/${id}/hard-delete`, {
    method: 'DELETE',
  });
}
