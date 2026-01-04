
export type Role = 'guest' | 'bd' | 'coach';

export interface Job {
  id: string;
  company: string;
  roles: string; // Stored as comma separated string
  location: string;
  link: string;
  raw_text?: string;
  created_at: string;
}

export interface ParseResult {
  valid: boolean;
  data?: Job;
  error?: string;
  rawLine: string;
}

export interface MatchResult {
  jobId: string;
  company: string;
  role: string;
  location: string;
  link: string;
  matchScore: number; // 0-100
  // reason 字段已移除
}

export enum AppState {
  AUTH = 'AUTH',
  BD_DASHBOARD = 'BD_DASHBOARD',
  COACH_DASHBOARD = 'COACH_DASHBOARD'
}
