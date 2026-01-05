/**
 * Authentication API client and token management
 */

import type { UserCredentials, AuthToken, User } from './types';

const TOKEN_KEY = 'codecollab_auth_token';

/**
 * Get stored auth token
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Store auth token
 */
export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove stored token
 */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Get API base URL
 */
function getApiBase(): string {
  const input = document.getElementById('apiBase') as HTMLInputElement;
  return (input?.value || 'http://localhost:8000').replace(/\/+$/, '');
}

/**
 * Register a new user
 */
export async function register(credentials: UserCredentials): Promise<AuthToken> {
  const url = `${getApiBase()}/auth/register`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || 'Registration failed');
  }

  return await response.json();
}

/**
 * Login with username and password
 */
export async function login(credentials: UserCredentials): Promise<AuthToken> {
  const url = `${getApiBase()}/auth/login`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || 'Login failed');
  }

  return await response.json();
}

/**
 * Get current user info
 */
export async function getCurrentUser(token: string): Promise<User> {
  const url = `${getApiBase()}/auth/me`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  return await response.json();
}

/**
 * Logout (just remove token)
 */
export function logout(): void {
  removeToken();
}

