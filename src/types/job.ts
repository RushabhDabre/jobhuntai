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
  userId?: string;
  title: string;
  company: string;
  location: string;
  city?: string; // Pune, Mumbai, Hyderabad, Bengaluru, Delhi-NCR, Chennai, Remote
  remoteType?: 'remote' | 'hybrid' | 'onsite' | 'unknown';
  roleCategory?: 'Software Developer' | 'Frontend Developer' | 'Fullstack Developer' | 'React Developer' | 'Backend Developer' | 'Other';
  technologies?: string[]; // e.g. ['React', 'Java', 'C#', '.NET', 'Python', 'Node.js', 'Spring Boot']
  salary?: string;
  salaryInLpa?: string; // e.g. "₹8 - ₹15 LPA"
  url: string;
  source: JobSource;
  description: string;
  requirements?: string[];
  department?: string;
  experienceRequired?: string; // e.g. "2-5 years"
  status: JobStatus;
  matchScore?: number;
  matchAnalysis?: MatchAnalysis;
  coverLetter?: string;
  coldPitch?: string;
  linkedinDm?: string;
  notes?: string;
  appliedDate?: string;
  postedAt?: string; // ISO date when vacancy was published (defaults to createdAt if unknown)
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id?: string;
  userId?: string;
  name: string;
  email?: string;
  phone?: string;
  currentLocation: string; // e.g. "Pune, India"
  preferredLocations: string[]; // e.g. ["Pune", "Mumbai", "Hyderabad", "Remote"]
  targetTitles: string[]; // e.g. ["Software Developer", "Frontend Developer", "React Developer", "Fullstack Developer"]
  preferredTechnologies: string[]; // e.g. ["React", "Java", "C#", ".NET", "Python"]
  yearsOfExperience: number;
  currentCtc?: string; // e.g. "₹8 LPA"
  expectedCtc?: string; // e.g. "₹12 - ₹18 LPA"
  noticePeriod: 'Immediate Joiner' | '15 Days' | '30 Days' | '60 Days' | '90 Days' | 'Serving Notice';
  preferredWorkMode: 'remote' | 'hybrid' | 'onsite' | 'any';
  skills: string[];
  suggestedRoles?: string[];
  suggestedTechnologies?: string[];
  domainCategory?: string;
  resumeText: string;
  resumeFileName?: string;
  geminiApiKey?: string;
  hasCompletedQuickSetup?: boolean;
  bioNotes?: string;
  updatedAt: string;
}

export interface AppSettings {
  geminiApiKey?: string;
  firecrawlApiKey?: string;
  apifyApiToken?: string;
  defaultGeminiModel?: string;
  targetMarket?: string;
  updatedAt: string;
}
