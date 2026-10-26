import fs from 'node:fs';
import path from 'node:path';
import { Job, UserProfile, AppSettings } from '@/types/job';

const DATA_DIR = path.join(process.cwd(), 'data');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');
const PROFILE_FILE = path.join(DATA_DIR, 'profile.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Alex Developer',
  email: 'alex.developer@example.com',
  targetTitles: ['Full Stack Engineer', 'Senior Frontend Engineer', 'AI Application Engineer'],
  targetLocations: ['San Francisco, CA', 'Remote (US/Global)', 'New York, NY'],
  preferredRemote: true,
  yearsOfExperience: 5,
  minSalary: '$140,000',
  skills: [
    'React',
    'Next.js',
    'TypeScript',
    'Node.js',
    'Tailwind CSS',
    'Python',
    'Gemini API',
    'REST & GraphQL',
    'PostgreSQL',
    'Docker'
  ],
  resumeText: `Alex Developer
Experienced Full Stack & AI Applications Engineer with 5+ years building modern web applications.
Key Experience:
- Led frontend architecture migration to Next.js 15/React 19 with App Router and Tailwind CSS, improving Core Web Vitals LCP by 40%.
- Integrated LLMs (Gemini, OpenAI) for automated document summarization, semantic search, and streaming conversational chat features.
- Developed backend microservices using Node.js, TypeScript, and Python with PostgreSQL and Redis caching.
- Built automated web scraping pipelines using Firecrawl, Playwright, and Apify actors to harvest real-time market data.
Education: B.S. in Computer Science.`,
  bioNotes: 'Looking for fast-paced product teams working on modern web, developer tooling, or AI-powered workflows.',
  updatedAt: new Date().toISOString(),
};

const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  firecrawlApiKey: process.env.FIRECRAWL_API_KEY || '',
  apifyApiToken: process.env.APIFY_API_TOKEN || '',
  defaultGeminiModel: 'gemini-2.5-flash',
  updatedAt: new Date().toISOString(),
};

const SAMPLE_JOBS: Job[] = [
  {
    id: 'job-seed-1',
    title: 'Senior Frontend / Fullstack Engineer',
    company: 'Linear',
    location: 'Remote',
    remoteType: 'remote',
    salary: '$160,000 - $210,000',
    url: 'https://linear.app/careers',
    source: 'firecrawl',
    description: `We are looking for a Senior Frontend / Fullstack Engineer to craft best-in-class product experiences.
Responsibilities:
- Build high-performance, keyboard-first web applications using React, TypeScript, and modern CSS.
- Optimize client-side state synchronization, local-first architectures, and rendering performance.
- Collaborate with designers and product engineers to ship delightful features with exceptional attention to detail.
Requirements:
- 4+ years of professional experience with React and TypeScript.
- Strong eye for UI craft, micro-interactions, and accessibility.
- Experience with real-time web applications, state management, and modern browser APIs.`,
    requirements: [
      '4+ years React and TypeScript',
      'High attention to UI craft and performance',
      'Local-first / modern web state knowledge'
    ],
    status: 'saved',
    matchScore: 92,
    matchAnalysis: {
      score: 92,
      recommendation: 'Strong Fit',
      summary: 'Outstanding alignment with your 5 years of React/TypeScript experience, Next.js UI performance work, and strong product craft.',
      strengths: [
        '5+ years deep React & TypeScript mastery',
        'Proven track record optimizing Core Web Vitals and client rendering',
        'Full alignment on remote work preference'
      ],
      gaps: [
        'Linear places strong emphasis on local-first sync engines (Replicache/CRDTs) which is worth highlighting'
      ],
      interviewTalkingPoints: [
        'Share your Next.js App Router performance optimizations and how you minimized render lag',
        'Discuss your approach to keyboard navigation and responsive micro-interactions'
      ],
      evaluatedAt: new Date().toISOString()
    },
    notes: 'Exciting product! Reach out to engineering team on X/LinkedIn.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'job-seed-2',
    title: 'AI Platform Software Engineer',
    company: 'Anthropic',
    location: 'San Francisco, CA / Remote',
    remoteType: 'hybrid',
    salary: '$180,000 - $240,000',
    url: 'https://anthropic.com/careers',
    source: 'firecrawl',
    description: `Join Anthropic to build user-facing platforms and tooling for frontier AI models.
Responsibilities:
- Build internal and developer-facing web interfaces for model evaluation and API orchestration.
- Connect complex agentic workflows, streaming inference pipelines, and scalable APIs.
- Work with Python, TypeScript, and modern web application frameworks.
Requirements:
- Strong experience with TypeScript, Python, and cloud infrastructure.
- Experience building developer tools, LLM applications, or data pipelines.`,
    requirements: ['TypeScript', 'Python', 'LLM orchestration', 'Fullstack API design'],
    status: 'discovered',
    matchScore: 88,
    matchAnalysis: {
      score: 88,
      recommendation: 'Strong Fit',
      summary: 'Great match with your background in AI integration, Python services, and TypeScript web dashboards.',
      strengths: [
        'Hands-on LLM application development experience',
        'Solid dual proficiency in TypeScript and Python',
        'Background with scraping and data pipelines'
      ],
      gaps: [
        'Hybrid preference noted in San Francisco; check remote flexibility for this specific role'
      ],
      interviewTalkingPoints: [
        'Highlight your experience connecting streaming model responses with responsive frontends',
        'Talk about handling rate limits, error fallbacks, and agent evaluation'
      ],
      evaluatedAt: new Date().toISOString()
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'job-seed-3',
    title: 'Full Stack Engineer - Growth & Automation',
    company: 'Stripe',
    location: 'Remote',
    remoteType: 'remote',
    salary: '$170,000 - $220,000',
    url: 'https://stripe.com/jobs',
    source: 'apify',
    description: `Stripe is looking for engineers to accelerate developer onboarding and autonomous growth loops.
You will build fullstack web platforms, design reliable data pipelines, and integrate AI-assisted customer workflows.
Requirements:
- 3+ years full stack web development (JavaScript/TypeScript, Ruby, or Python).
- Passion for API reliability, payment systems, and developer ergonomics.`,
    requirements: ['3+ years Fullstack', 'APIs & Web apps', 'Growth/Data automation'],
    status: 'applied',
    matchScore: 85,
    appliedDate: '2026-10-24',
    notes: 'Submitted application through employee referral link.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export function getJobs(): Job[] {
  ensureDataDir();
  if (!fs.existsSync(JOBS_FILE)) {
    saveJobs(SAMPLE_JOBS);
    return SAMPLE_JOBS;
  }
  try {
    const raw = fs.readFileSync(JOBS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading jobs file, resetting to sample jobs:', err);
    return SAMPLE_JOBS;
  }
}

export function saveJobs(jobs: Job[]): void {
  ensureDataDir();
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2), 'utf-8');
}

export function getJobById(id: string): Job | undefined {
  const jobs = getJobs();
  return jobs.find((j) => j.id === id);
}

export function upsertJob(job: Job): Job {
  const jobs = getJobs();
  const index = jobs.findIndex((j) => j.id === job.id);
  const now = new Date().toISOString();
  if (index >= 0) {
    jobs[index] = { ...jobs[index], ...job, updatedAt: now };
    saveJobs(jobs);
    return jobs[index];
  } else {
    const newJob = { ...job, createdAt: job.createdAt || now, updatedAt: now };
    jobs.unshift(newJob);
    saveJobs(jobs);
    return newJob;
  }
}

export function deleteJob(id: string): boolean {
  const jobs = getJobs();
  const filtered = jobs.filter((j) => j.id !== id);
  if (filtered.length !== jobs.length) {
    saveJobs(filtered);
    return true;
  }
  return false;
}

export function getUserProfile(): UserProfile {
  ensureDataDir();
  if (!fs.existsSync(PROFILE_FILE)) {
    saveUserProfile(DEFAULT_PROFILE);
    return DEFAULT_PROFILE;
  }
  try {
    const raw = fs.readFileSync(PROFILE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading profile file:', err);
    return DEFAULT_PROFILE;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  ensureDataDir();
  fs.writeFileSync(PROFILE_FILE, JSON.stringify(profile, null, 2), 'utf-8');
}

export function getAppSettings(): AppSettings {
  ensureDataDir();
  if (!fs.existsSync(SETTINGS_FILE)) {
    saveAppSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      // fallback to env vars if not set in file
      geminiApiKey: parsed.geminiApiKey || process.env.GEMINI_API_KEY || '',
      firecrawlApiKey: parsed.firecrawlApiKey || process.env.FIRECRAWL_API_KEY || '',
      apifyApiToken: parsed.apifyApiToken || process.env.APIFY_API_TOKEN || '',
    };
  } catch (err) {
    console.error('Error reading settings file:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveAppSettings(settings: Partial<AppSettings>): AppSettings {
  ensureDataDir();
  let baseSettings = DEFAULT_SETTINGS;
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      baseSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      baseSettings = DEFAULT_SETTINGS;
    }
  }
  const updated: AppSettings = {
    ...baseSettings,
    ...settings,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}
