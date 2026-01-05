/**
 * API client for CodeCollab backend
 */

import type {
  Problem,
  SubmissionRequest,
  SubmissionResponse,
  LeaderboardEntry
} from './types';

/**
 * Get the API base URL (without trailing slash)
 */
export function getApiBase(): string {
  const input = document.getElementById('apiBase') as HTMLInputElement;
  return (input?.value || '').replace(/\/+$/, '');
}

/**
 * Initialize API base URL from query params or localStorage
 */
export function initApiBase(): void {
  const input = document.getElementById('apiBase') as HTMLInputElement;
  if (!input) return;

  const qp = new URLSearchParams(location.search);
  const fromQuery = qp.get('api');
  const fromStorage = localStorage.getItem('codecollab_api_base');

  if (fromQuery) {
    input.value = fromQuery;
  } else if (fromStorage) {
    input.value = fromStorage;
  }
}

/**
 * Save API base URL to localStorage
 */
export function saveApiBase(): void {
  localStorage.setItem('codecollab_api_base', getApiBase());
}

/**
 * Generic GET request
 */
async function apiGet<T>(path: string): Promise<T> {
  const url = `${getApiBase()}${path}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get authorization headers if token exists
 */
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('codecollab_auth_token');
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  return {};
}

/**
 * Generic POST request
 */
async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const url = `${getApiBase()}${path}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Fetch all problems
 */
export function fetchProblems(): Promise<Problem[]> {
  return apiGet<Problem[]>('/problems');
}

/**
 * Fetch a single problem by ID
 */
export function fetchProblem(problemId: string): Promise<Problem> {
  return apiGet<Problem>(`/problems/${encodeURIComponent(problemId)}`);
}

/**
 * Submit code for judging
 */
export function submitCode(req: SubmissionRequest): Promise<SubmissionResponse> {
  return apiPost<SubmissionResponse>('/submissions', req);
}

/**
 * Fetch leaderboard
 */
export function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  return apiGet<LeaderboardEntry[]>('/leaderboard');
}

/**
 * Fetch user's submission history
 */
export function fetchUserSubmissions(username: string): Promise<SubmissionResponse[]> {
  return apiGet<SubmissionResponse[]>(`/users/${encodeURIComponent(username)}/submissions`);
}

