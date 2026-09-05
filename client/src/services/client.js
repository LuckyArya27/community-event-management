const SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL;
const TOKEN_KEY = 'token';

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
}

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
}

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}


export async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };
  try {
  const response = await fetch(`${SERVER_BASE_URL}${endpoint}`, { ...options, headers });

  if (response.status === 204) {
    return undefined; // No content
  }

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(response.status, data.message || 'An error occurred');
  }

  return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    } else {
      throw new ApiError(500, 'Network error or server is unreachable');
    }
  }
}