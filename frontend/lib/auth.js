// Client-side session and token helpers for IDentix
const TOKEN_KEY = 'identix_session_token';
const USER_ID_KEY = 'identix_user_id';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getUserId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(USER_ID_KEY);
}

export function setUserId(userId) {
  if (typeof window === 'undefined') return;
  if (userId) {
    localStorage.setItem(USER_ID_KEY, userId);
  } else {
    localStorage.removeItem(USER_ID_KEY);
  }
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
}
