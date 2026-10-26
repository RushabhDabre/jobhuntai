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
  | 'naukri'
  | 'instahyre'
  | 'linkedin-india'
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
  indiaRelevance?: {
    locationFit: string;
    salaryFit: string;
    noticePeriodFit: string;
  };
  evaluatedAt: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  city?: string; // Bengaluru, Hyderabad, Pune, Mumbai, Delhi-NCR, Chennai, Remote
  remoteType?: 'remote' | 'hybrid' | 'onsite' | 'unknown';
  salary?: string;
  salaryInLpa?: string; // e.g. "₹24 - ₹32 LPA"
  url: string;
  source: JobSource;
  description: string;
  requirements?: string[];
  department?: string;
  experienceRequired?: string; // e.g. "3-5 years"
  status: JobStatus;
  matchScore?: number;
  matchAnalysis?: MatchAnalysis;
  coverLetter?: string;
  coldPitch?: string;
  linkedinDm?: string;
  notes?: string;
  appliedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  name: string;
  email?: string;
  phone?: string;
  currentLocation: string; // e.g. "Bengaluru, India"
  preferredLocations: string[]; // e.g. ["Bengaluru", "Pune", "Hyderabad", "Remote (India)"]
  targetTitles: string[];
  yearsOfExperience: number;
  currentCtc?: string; // e.g. "₹18 LPA"
  expectedCtc?: string; // e.g. "₹28 - ₹35 LPA"
  noticePeriod: 'Immediate Joiner' | '15 Days' | '30 Days' | '60 Days' | '90 Days' | 'Serving Notice';
  preferredWorkMode: 'remote' | 'hybrid' | 'onsite' | 'any';
  skills: string[];
  resumeText: string;
  resumeFileName?: string;
  bioNotes?: string;
  updatedAt: string;
}

export interface AppSettings {
  geminiApiKey?: string;
  firecrawlApiKey?: string;
  apifyApiToken?: string;
  defaultGeminiModel?: string;
  targetMarket?: string; // Default: "India"
  updatedAt: string;
}
