/**
 * Type definitions for CodeCollab MVP
 */

export interface Problem {
  id: string;
  title: string;
  statement: string;
  time_limit_ms: number;
  output_limit_bytes: number;
}

export interface TestCase {
  input: string;
  expected: string;
}

export interface CaseResult {
  index: number;
  status: 'AC' | 'WA' | 'TLE' | 'RE' | 'CE';
  time_ms: number;
  stdout: string;
  stderr: string;
  input?: string;
  expected?: string;
}

export interface JudgeResult {
  status: 'AC' | 'WA' | 'TLE' | 'RE' | 'CE';
  passed: number;
  total: number;
  time_ms: number;
  cases: CaseResult[];
}

export interface SubmissionRequest {
  username: string;
  problem_id: string;
  language: 'python' | 'javascript';
  source_code: string;
}

export interface SubmissionResponse {
  submission_id: string;
  result: JudgeResult;
  timestamp?: number;
}

export interface LeaderboardEntry {
  username: string;
  solved_count: number;
  total_submissions: number;
}

export type Language = 'python' | 'javascript';

// Authentication types
export interface User {
  id: string;
  username: string;
  created_at: number;
}

export interface UserCredentials {
  username: string;
  password: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

