export type JobStatus =
  | 'discovered'
  | 'saved'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'archived';

export type JobSource =
  | 'firecrawl'
  | 'apify'
  | 'greenhouse'
  | 'lever'
  | 'ashby'
  | 'manual';

export interface MatchAnalysis {
  score: number; // 0 - 100
  recommendation: 'Strong Fit' | 'Good Match' | 'Borderline' | 'Not Recommended';
  summary: string;
  strengths: string[];
  gaps: string[];
  interviewTalkingPoints: string[];
  evaluatedAt: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  remoteType?: 'remote' | 'hybrid' | 'onsite' | 'unknown';
  salary?: string;
  url: string;
  source: JobSource;
  description: string;
  requirements?: string[];
  department?: string;
  status: JobStatus;
  matchScore?: number;
  matchAnalysis?: MatchAnalysis;
  coverLetter?: string;
  coldPitch?: string;
  notes?: string;
  appliedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  name: string;
  email?: string;
  targetTitles: string[];
  targetLocations: string[];
  preferredRemote: boolean;
  yearsOfExperience: number;
  minSalary?: string;
  skills: string[];
  resumeText: string;
  bioNotes?: string;
  updatedAt: string;
}

export interface AppSettings {
  geminiApiKey?: string;
  firecrawlApiKey?: string;
  apifyApiToken?: string;
  defaultGeminiModel?: string;
  updatedAt: string;
}

export interface HarvestResult {
  jobs: Partial<Job>[];
  source: JobSource;
  meta?: Record<string, unknown>;
}
