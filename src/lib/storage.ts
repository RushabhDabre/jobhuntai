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
  name: 'Rushabh Dabare',
  email: 'rushabh.dabare@seaker.ai',
  phone: '+91 98765 43210',
  currentLocation: 'Bengaluru, India',
  preferredLocations: ['Bengaluru', 'Pune', 'Hyderabad', 'Remote (India)'],
  targetTitles: ['Senior Full Stack Engineer', 'SDE 2 / SDE 3', 'Senior Frontend Engineer', 'AI Engineer'],
  yearsOfExperience: 4.5,
  currentCtc: '₹18 LPA',
  expectedCtc: '₹28 - ₹35 LPA',
  noticePeriod: '30 Days',
  preferredWorkMode: 'any',
  skills: [
    'React',
    'Next.js',
    'TypeScript',
    'Node.js',
    'Python',
    'PostgreSQL',
    'Tailwind CSS',
    'Docker',
    'Gemini API',
    'AWS',
    'System Design',
    'REST APIs'
  ],
  resumeText: `RUSHABH DABARE
Senior Software / Full Stack Engineer | Bengaluru, India
rushabh.dabare@seaker.ai | +91 98765 43210 | Notice Period: 30 Days

SUMMARY:
4.5+ years of experience engineering high-performance web applications, distributed systems, and AI-enabled product workflows. Expertise in React, Next.js, TypeScript, Node.js, and Python.

WORK EXPERIENCE:
1. Senior Full Stack Engineer (2023 - Present)
- Architected and shipped scalable microservices and customer dashboards handling 500k+ daily API requests.
- Integrated LLMs (Gemini, OpenAI) for automated text summarization, candidate extraction, and real-time streaming tools.
- Reduced core page loading times (LCP) by 45% using Next.js App Router and server-side streaming.

2. Software Development Engineer (2021 - 2023)
- Built user-facing web portals in React, TypeScript, and Tailwind CSS.
- Developed backend REST endpoints in Node.js / Express with PostgreSQL and Redis caching.
- Collaborated in an agile product team to drive key metrics and feature velocity.

EDUCATION:
B.Tech in Computer Science & Engineering (2017 - 2021)

KEY SKILLS:
Languages: TypeScript, JavaScript, Python, SQL
Frontend: React 18/19, Next.js, Tailwind CSS, State Management (Zustand/Redux)
Backend: Node.js, Express, FastAPI, PostgreSQL, Redis, REST APIs, Microservices
DevOps & Tools: Docker, Git, CI/CD, AWS, Postman`,
  bioNotes: 'Looking for high-impact SDE-2 or Senior roles in Bengaluru/Pune/Remote with product-first engineering culture.',
  updatedAt: new Date().toISOString(),
};

const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  firecrawlApiKey: process.env.FIRECRAWL_API_KEY || '',
  apifyApiToken: process.env.APIFY_API_TOKEN || '',
  defaultGeminiModel: 'gemini-2.5-flash',
  targetMarket: 'India',
  updatedAt: new Date().toISOString(),
};

const SAMPLE_JOBS_INDIA: Job[] = [
  {
    id: 'job-india-1',
    title: 'Senior Software Engineer (Frontend / Fullstack)',
    company: 'Razorpay',
    location: 'Bengaluru, Karnataka, India',
    city: 'Bengaluru',
    remoteType: 'hybrid',
    salaryInLpa: '₹32 - ₹42 LPA',
    salary: '₹32 - ₹42 LPA + ESOPs',
    experienceRequired: '4 - 7 years',
    url: 'https://razorpay.com/jobs',
    source: 'greenhouse',
    description: `Razorpay is India's leading fintech payments platform. We are seeking a Senior Software Engineer to build resilient, accessible payment checkout experiences and merchant dashboards.

Responsibilities:
- Build low-latency, resilient web UI using React, TypeScript, and modern state architectures.
- Scale frontend infrastructure serving millions of transactions across India.
- Work closely with backend teams, design, and product managers to launch innovative merchant features.

Requirements:
- 4+ years of hands-on experience in modern frontend and web technologies (React, TypeScript).
- Deep understanding of browser internals, web performance, and responsive interfaces.
- Experience with payment flows or high-traffic consumer systems is a plus.`,
    requirements: [
      '4+ years React & TypeScript',
      'Web performance & Core Web Vitals optimization',
      'Experience with scalable frontend systems'
    ],
    status: 'saved',
    matchScore: 94,
    matchAnalysis: {
      score: 94,
      recommendation: 'Strong Fit',
      summary: 'Exceptional match! Your 4.5 years of React/TypeScript experience, LCP optimization background, and Bengaluru location strongly align with Razorpay engineering standards.',
      strengths: [
        'Direct alignment with 4+ years React and TypeScript tech stack',
        'Demonstrated Core Web Vitals LCP optimization track record',
        'Immediate location match in Bengaluru'
      ],
      gaps: [
        'Fintech payment protocols and security compliance experience can be highlighted during interview'
      ],
      interviewTalkingPoints: [
        'Discuss how you handled high throughput API requests and client-side error states',
        'Highlight your App Router migration and 45% LCP load reduction'
      ],
      indiaRelevance: {
        locationFit: 'Matches preferred city (Bengaluru)',
        salaryFit: 'Within your expected bracket (₹28 - ₹35 LPA vs ₹32 - ₹42 LPA)',
        noticePeriodFit: '30 Days notice period is widely accepted at Razorpay'
      },
      evaluatedAt: new Date().toISOString()
    },
    notes: 'Razorpay engineering bar is high on JS fundamentals and system design. Reaching out to recruiter on LinkedIn.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'job-india-2',
    title: 'SDE 2 - Full Stack Engineer (Growth & AI)',
    company: 'Swiggy',
    location: 'Bengaluru / Remote (India)',
    city: 'Bengaluru',
    remoteType: 'remote',
    salaryInLpa: '₹28 - ₹36 LPA',
    salary: '₹28 - ₹36 LPA',
    experienceRequired: '3 - 6 years',
    url: 'https://careers.swiggy.com',
    source: 'lever',
    description: `Swiggy is building consumer tech that powers convenience for millions of Indians every day.
We are looking for an SDE 2 to join the Growth engineering team.

Responsibilities:
- Build and maintain high-conversion customer touchpoints on web and app-web views.
- Integrate automated experiments, feature flags, and AI-driven personalization pipelines.
- Collaborate with backend engineers on Node.js/Java microservices.

Requirements:
- 3+ years experience with React, TypeScript, and Node.js.
- Strong problem-solving skills and experience with high-scale web platforms.`,
    requirements: ['React', 'TypeScript', 'Node.js', 'System Design basics'],
    status: 'discovered',
    matchScore: 90,
    matchAnalysis: {
      score: 90,
      recommendation: 'Strong Fit',
      summary: 'High relevance for your experience with fullstack Node/React stacks and AI application experiments.',
      strengths: [
        'Fullstack JavaScript/TypeScript mastery',
        'Strong alignment with target CTC bracket (₹28 - ₹36 LPA)',
        'Remote India flexibility'
      ],
      gaps: [
        'Familiarity with large-scale A/B testing infrastructure'
      ],
      interviewTalkingPoints: [
        'Explain how you integrated LLMs into existing web services',
        'Walk through your microservice architecture with Node and PostgreSQL'
      ],
      indiaRelevance: {
        locationFit: 'Offers Remote (India) or Bengaluru office',
        salaryFit: 'Perfect match for ₹28 - ₹35 LPA expected CTC',
        noticePeriodFit: '30 days notice is accepted'
      },
      evaluatedAt: new Date().toISOString()
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'job-india-3',
    title: 'Senior Software Engineer - Cloud & Web Platforms',
    company: 'Atlassian India',
    location: 'Bengaluru, India / Remote (Work from Anywhere in India)',
    city: 'Bengaluru',
    remoteType: 'remote',
    salaryInLpa: '₹40 - ₹52 LPA',
    salary: '₹40 - ₹52 LPA + Stocks',
    experienceRequired: '4 - 8 years',
    url: 'https://www.atlassian.com/company/careers',
    source: 'firecrawl',
    description: `Atlassian fuels team collaboration across the world (Jira, Confluence, Trello).
Atlassian India operates with Team Anywhere policy (work anywhere in India).

Role:
- Build robust developer interfaces and cloud features using React, TypeScript, GraphQL, and modern web standards.
- Champion accessibility, performance, and cross-browser reliability.
- Participate in distributed architectural reviews and code mentorship.

Requirements:
- 4+ years of production web engineering experience.
- Deep expertise in JavaScript/TypeScript, modern frontend patterns, and distributed web services.`,
    requirements: ['React & TypeScript', 'Team Anywhere in India', '4+ years SDE experience'],
    status: 'applied',
    matchScore: 89,
    appliedDate: '2026-10-25',
    notes: 'Submitted via employee referral. Team Anywhere in India policy is top tier.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'job-india-4',
    title: 'Frontend Engineer 2',
    company: 'BrowserStack',
    location: 'Mumbai / Remote (India)',
    city: 'Mumbai',
    remoteType: 'remote',
    salaryInLpa: '₹22 - ₹30 LPA',
    salary: '₹22 - ₹30 LPA',
    experienceRequired: '3 - 6 years',
    url: 'https://www.browserstack.com/careers',
    source: 'ashby',
    description: `BrowserStack is the world's leading software testing platform, built proudly from India.
Join our core product team to craft high-speed developer testing dashboards and interactive devtools.

Requirements:
- 3+ years experience building complex single page applications in React/TypeScript.
- Passion for developer tools, canvas/DOM performance, and web standards.`,
    requirements: ['React', 'TypeScript', 'DevTools / Testing mindset'],
    status: 'discovered',
    matchScore: 86,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export function getJobs(): Job[] {
  ensureDataDir();
  if (!fs.existsSync(JOBS_FILE)) {
    saveJobs(SAMPLE_JOBS_INDIA);
    return SAMPLE_JOBS_INDIA;
  }
  try {
    const raw = fs.readFileSync(JOBS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveJobs(SAMPLE_JOBS_INDIA);
      return SAMPLE_JOBS_INDIA;
    }
    return parsed;
  } catch (err) {
    console.error('Error reading jobs file, resetting to sample jobs:', err);
    return SAMPLE_JOBS_INDIA;
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
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Error reading profile file:', err);
    return DEFAULT_PROFILE;
  }
}

export function saveUserProfile(profile: Partial<UserProfile>): UserProfile {
  ensureDataDir();
  let baseProfile = DEFAULT_PROFILE;
  if (fs.existsSync(PROFILE_FILE)) {
    try {
      const raw = fs.readFileSync(PROFILE_FILE, 'utf-8');
      baseProfile = { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
    } catch {
      baseProfile = DEFAULT_PROFILE;
    }
  }
  const updated: UserProfile = {
    ...baseProfile,
    ...profile,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(PROFILE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
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
