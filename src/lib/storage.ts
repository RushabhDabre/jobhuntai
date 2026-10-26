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
  currentLocation: 'Pune, India',
  preferredLocations: ['Pune', 'Mumbai', 'Hyderabad'],
  targetTitles: ['Software Developer', 'Frontend Developer', 'Fullstack Developer', 'React Developer'],
  preferredTechnologies: ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'Java'],
  yearsOfExperience: 3.5,
  currentCtc: '₹7 LPA',
  expectedCtc: '₹10 - ₹16 LPA',
  noticePeriod: '30 Days',
  preferredWorkMode: 'any',
  skills: [
    'React',
    'JavaScript',
    'TypeScript',
    'HTML/CSS',
    'Node.js',
    'Python',
    'Java',
    'SQL',
    'REST APIs',
    'Git'
  ],
  resumeText: `RUSHABH DABARE
Software Developer | Pune, Maharashtra | +91 98765 43210 | Notice: 30 Days

SUMMARY:
3.5+ years of software development experience specializing in web applications using React, JavaScript/TypeScript, Python, and modern REST APIs. Hands-on experience developing frontends, working with relational databases, and debugging production issues.

WORK EXPERIENCE:
Software Developer (2022 - Present) | Pune
- Developed responsive single-page web applications using React and JavaScript.
- Built reusable UI components and integrated RESTful endpoints with backend services.
- Managed application state and optimized rendering performance across major browsers.
- Wrote SQL queries and integrated database layers with Node.js and Python.

Associate Software Engineer (2021 - 2022) | Mumbai
- Collaborated in an agile sprint team to implement client bug fixes and UI enhancements.
- Maintained code quality through unit testing and Git pull request reviews.

EDUCATION:
B.E. in Computer Engineering (2017 - 2021)

SKILLS:
Technologies: React, JavaScript, TypeScript, Python, Java, C#, .NET basics, HTML5, CSS3, SQL, Git, REST APIs`,
  hasCompletedQuickSetup: false,
  bioNotes: 'Looking for immediate/active vacancies in Pune, Mumbai, or Hyderabad.',
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

// Realistic vacancies with real platforms (Naukri, LinkedIn, Indeed) and exact hours ago
const now = Date.now();
const hours = (h: number) => new Date(now - h * 60 * 60 * 1000).toISOString();
const days = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString();

const REAL_INDIAN_VACANCIES: Job[] = [
  // --- VACANCIES POSTED WITHIN LAST 48 HOURS ---
  {
    id: 'job-fresh-1',
    title: 'React Developer / Frontend Engineer',
    company: 'Zensar Technologies',
    location: 'Pune, Maharashtra',
    city: 'Pune',
    remoteType: 'hybrid',
    roleCategory: 'React Developer',
    technologies: ['React', 'JavaScript', 'TypeScript', 'HTML/CSS'],
    salaryInLpa: '₹8 - ₹14 LPA',
    salary: '₹8 - ₹14 LPA',
    experienceRequired: '2 - 5 years',
    url: 'https://www.naukri.com/job-listings-react-developer-zensar-pune',
    source: 'naukri',
    postedAt: hours(6), // 6 hours ago
    description: `Urgent opening for React Developer at Zensar Pune campus (Kalyani Nagar / Hybrid).
Key Responsibilities:
- Develop responsive web applications using React 18, JavaScript (ES6+), and Redux/Context API.
- Consume REST APIs, handle asynchronous requests, and manage cross-browser compatibility.
- Write clean, modular, and maintainable frontend code.
Requirements:
- 2.5+ years of production experience in React development.
- Strong knowledge of modern JavaScript, DOM manipulation, and CSS frameworks.
- Notice period: Immediate to 30 Days preferred.`,
    requirements: ['React 18', 'JavaScript ES6+', 'REST APIs', 'Immediate or 30 days notice'],
    status: 'discovered',
    matchScore: 92,
    matchAnalysis: {
      score: 92,
      recommendation: 'Strong Fit',
      summary: 'Direct match for your 3.5 years of React and JavaScript experience in Pune, with 30-day notice period acceptance.',
      strengths: ['Direct React tech stack alignment', 'Location is Pune', 'Salary fits target bracket (₹8 - ₹14 LPA)'],
      gaps: ['Be prepared to showcase Redux or Context API state management workflows'],
      interviewTalkingPoints: ['Discuss your reusable React component library and state handling'],
      indiaRelevance: {
        locationFit: 'Matches Pune preference',
        salaryFit: 'Fits ₹10-16 LPA target',
        noticePeriodFit: '30 days notice accepted'
      },
      evaluatedAt: new Date().toISOString()
    },
    createdAt: hours(6),
    updatedAt: hours(6)
  },
  {
    id: 'job-fresh-2',
    title: 'Software Developer (Java / Fullstack)',
    company: 'Persistent Systems',
    location: 'Pune, Maharashtra',
    city: 'Pune',
    remoteType: 'hybrid',
    roleCategory: 'Software Developer',
    technologies: ['Java', 'Spring Boot', 'React', 'SQL'],
    salaryInLpa: '₹9 - ₹15 LPA',
    salary: '₹9 - ₹15 LPA',
    experienceRequired: '3 - 6 years',
    url: 'https://www.linkedin.com/jobs/view/software-developer-persistent-pune',
    source: 'linkedin-india',
    postedAt: hours(14), // 14 hours ago
    description: `Persistent Systems has active vacancies for Software Developers at Pune (Hinjawadi).
Responsibilities:
- Build and maintain backend microservices using Core Java, Spring Boot, and REST APIs.
- Collaborate with frontend developers using React / JavaScript.
- Write SQL queries, unit tests, and participate in code reviews.
Requirements:
- 3+ years experience with Java, Spring Boot, and relational databases.
- Basic understanding of frontend web frameworks like React is advantageous.`,
    requirements: ['Java', 'Spring Boot', 'React basics', 'SQL'],
    status: 'discovered',
    matchScore: 88,
    matchAnalysis: {
      score: 88,
      recommendation: 'Strong Fit',
      summary: 'Excellent match for fullstack software development in Pune (Hinjawadi).',
      strengths: ['Relevant software engineering background', 'Pune location match'],
      gaps: ['Brush up on Core Java multithreading and Spring Boot dependency injection'],
      interviewTalkingPoints: ['Highlight backend REST API integration and database query design'],
      evaluatedAt: new Date().toISOString()
    },
    createdAt: hours(14),
    updatedAt: hours(14)
  },
  {
    id: 'job-fresh-3',
    title: 'Fullstack Developer (React + Node / Python)',
    company: 'Hexaware Technologies',
    location: 'Mumbai / Pune, Maharashtra',
    city: 'Mumbai',
    remoteType: 'hybrid',
    roleCategory: 'Fullstack Developer',
    technologies: ['React', 'Node.js', 'Python', 'SQL'],
    salaryInLpa: '₹10 - ₹16 LPA',
    salary: '₹10 - ₹16 LPA',
    experienceRequired: '2 - 5 years',
    url: 'https://www.indeed.com/viewjob?jk=hexaware-fullstack-mumbai',
    source: 'apify',
    postedAt: hours(22), // 22 hours ago
    description: `Hexaware Technologies is hiring Fullstack Developers for its Mumbai (Mahape) and Pune centers.
Role:
- Implement end-to-end features from React frontends to Node.js/Python microservices.
- Design database schemas and optimize query execution in PostgreSQL/MySQL.
- Participate in agile sprint cycles and client feature delivery.
Requirements:
- 2.5 to 5 years hands-on experience in full stack web development.
- Solid understanding of React, JavaScript/TypeScript, and RESTful APIs.`,
    requirements: ['React', 'Node.js or Python', 'REST APIs', 'SQL'],
    status: 'discovered',
    matchScore: 94,
    matchAnalysis: {
      score: 94,
      recommendation: 'Strong Fit',
      summary: 'Matches both React and Node/Python skills in Mumbai/Pune with competitive compensation.',
      strengths: ['Complete fullstack tech match', 'Locations cover Mumbai and Pune', 'Within 48hr fresh posting'],
      gaps: ['Review Docker and deployment pipeline basics'],
      interviewTalkingPoints: ['Walk through a complete feature built end-to-end from frontend to DB'],
      evaluatedAt: new Date().toISOString()
    },
    createdAt: hours(22),
    updatedAt: hours(22)
  },
  {
    id: 'job-fresh-4',
    title: 'Software Engineer - Python Developer',
    company: 'Cyient Technologies',
    location: 'Hyderabad, Telangana',
    city: 'Hyderabad',
    remoteType: 'hybrid',
    roleCategory: 'Software Developer',
    technologies: ['Python', 'FastAPI', 'SQL', 'REST APIs'],
    salaryInLpa: '₹8 - ₹14 LPA',
    salary: '₹8 - ₹14 LPA',
    experienceRequired: '2 - 5 years',
    url: 'https://www.naukri.com/job-listings-python-developer-cyient-hyderabad',
    source: 'naukri',
    postedAt: hours(30), // 30 hours ago
    description: `Urgent requirement for Python Developer at Cyient Hyderabad campus.
Key Responsibilities:
- Develop scalable backend REST APIs using Python (FastAPI / Django).
- Integrate with relational and NoSQL databases.
- Collaborate with frontend teams and write unit tests.
Requirements:
- 2+ years of professional software development experience in Python.
- Knowledge of relational databases (PostgreSQL/MySQL).`,
    requirements: ['Python', 'FastAPI or Django', 'SQL', 'Hyderabad location'],
    status: 'discovered',
    matchScore: 86,
    createdAt: hours(30),
    updatedAt: hours(30)
  },
  {
    id: 'job-fresh-5',
    title: 'C# / .NET Software Developer',
    company: 'LTIMindtree',
    location: 'Pune / Mumbai, Maharashtra',
    city: 'Pune',
    remoteType: 'hybrid',
    roleCategory: 'Software Developer',
    technologies: ['C#', '.NET', 'SQL', 'Web APIs'],
    salaryInLpa: '₹8 - ₹15 LPA',
    salary: '₹8 - ₹15 LPA',
    experienceRequired: '2 - 6 years',
    url: 'https://www.linkedin.com/jobs/view/dotnet-developer-ltimindtree-pune',
    source: 'linkedin-india',
    postedAt: hours(38), // 38 hours ago
    description: `LTIMindtree is hiring .NET / C# Developers for enterprise web applications in Pune and Navi Mumbai.
Requirements:
- 2+ years experience in C#, ASP.NET Core, and Web API.
- Good understanding of SQL Server, object-oriented principles, and REST architecture.
- Immediate joiners or 30-day notice candidates preferred.`,
    requirements: ['C#', 'ASP.NET Core', 'SQL Server', 'REST Web APIs'],
    status: 'discovered',
    matchScore: 84,
    createdAt: hours(38),
    updatedAt: hours(38)
  },
  {
    id: 'job-fresh-6',
    title: 'Frontend Developer (React.js)',
    company: 'Virtusa',
    location: 'Hyderabad, Telangana',
    city: 'Hyderabad',
    remoteType: 'hybrid',
    roleCategory: 'Frontend Developer',
    technologies: ['React', 'JavaScript', 'CSS3', 'REST APIs'],
    salaryInLpa: '₹7 - ₹13 LPA',
    salary: '₹7 - ₹13 LPA',
    experienceRequired: '2 - 4 years',
    url: 'https://www.naukri.com/job-listings-reactjs-frontend-virtusa-hyderabad',
    source: 'naukri',
    postedAt: hours(44), // 44 hours ago
    description: `Virtusa Hyderabad is looking for a Frontend Developer with strong React.js fundamentals.
Key responsibilities:
- Build interactive web portals and dashboard modules using React.
- Ensure cross-browser compatibility and responsive design for enterprise clients.
- Work closely with UI/UX designers and backend service teams.`,
    requirements: ['React', 'JavaScript', 'HTML5/CSS3', 'Hyderabad location'],
    status: 'discovered',
    matchScore: 90,
    createdAt: hours(44),
    updatedAt: hours(44)
  },

  // --- VACANCIES POSTED WITHIN LAST 7 - 10 DAYS ---
  {
    id: 'job-days-7',
    title: 'Full Stack Engineer (React + Python)',
    company: 'CitiusTech',
    location: 'Mumbai (Airoli) / Pune',
    city: 'Mumbai',
    remoteType: 'hybrid',
    roleCategory: 'Fullstack Developer',
    technologies: ['React', 'Python', 'FastAPI', 'SQL'],
    salaryInLpa: '₹9 - ₹16 LPA',
    salary: '₹9 - ₹16 LPA',
    experienceRequired: '3 - 6 years',
    url: 'https://www.naukri.com/job-listings-fullstack-citiustech-mumbai',
    source: 'naukri',
    postedAt: days(4), // 4 days ago
    description: `CitiusTech is hiring Full Stack Engineers for healthcare product engineering in Mumbai / Pune.
Requirements:
- 3+ years in React.js and Python (Django/FastAPI).
- Database knowledge (MySQL/PostgreSQL) and Git version control.`,
    requirements: ['React', 'Python', 'SQL', 'Mumbai / Pune'],
    status: 'saved',
    matchScore: 89,
    createdAt: days(4),
    updatedAt: days(4)
  },
  {
    id: 'job-days-8',
    title: 'Java Developer / Backend Software Engineer',
    company: 'Tata Elxsi',
    location: 'Pune, Maharashtra',
    city: 'Pune',
    remoteType: 'hybrid',
    roleCategory: 'Software Developer',
    technologies: ['Java', 'Spring Boot', 'Microservices', 'SQL'],
    salaryInLpa: '₹8 - ₹15 LPA',
    salary: '₹8 - ₹15 LPA',
    experienceRequired: '2 - 5 years',
    url: 'https://www.indeed.com/viewjob?jk=tataelxsi-java-pune',
    source: 'apify',
    postedAt: days(6), // 6 days ago
    description: `Tata Elxsi Pune is seeking a Java Software Developer to work on connected vehicle and cloud IoT backends.
Requirements:
- Hands-on experience with Java 11/17 and Spring Boot microservices.
- Experience writing REST APIs and working with relational databases.`,
    requirements: ['Java', 'Spring Boot', 'Microservices', 'Pune'],
    status: 'discovered',
    matchScore: 85,
    createdAt: days(6),
    updatedAt: days(6)
  },
  {
    id: 'job-days-9',
    title: 'Senior Frontend Developer (React / Next.js)',
    company: 'BrowserStack',
    location: 'Mumbai / Remote (India)',
    city: 'Mumbai',
    remoteType: 'remote',
    roleCategory: 'Frontend Developer',
    technologies: ['React', 'TypeScript', 'Next.js'],
    salaryInLpa: '₹18 - ₹26 LPA',
    salary: '₹18 - ₹26 LPA',
    experienceRequired: '3 - 6 years',
    url: 'https://www.browserstack.com/careers',
    source: 'ashby',
    postedAt: days(8), // 8 days ago
    description: `BrowserStack is hiring Frontend Developers to build high-performance developer testing tools.
Requirements:
- 3+ years experience with React, TypeScript, and modern browser internals.
- Remote within India.`,
    requirements: ['React', 'TypeScript', 'Remote in India'],
    status: 'applied',
    matchScore: 93,
    appliedDate: '2026-10-24',
    notes: 'Application submitted via referral on LinkedIn.',
    createdAt: days(8),
    updatedAt: days(8)
  }
];

export function getJobs(): Job[] {
  ensureDataDir();
  if (!fs.existsSync(JOBS_FILE)) {
    saveJobs(REAL_INDIAN_VACANCIES);
    return REAL_INDIAN_VACANCIES;
  }
  try {
    const raw = fs.readFileSync(JOBS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveJobs(REAL_INDIAN_VACANCIES);
      return REAL_INDIAN_VACANCIES;
    }
    return parsed;
  } catch (err) {
    console.error('Error reading jobs file, resetting to seed jobs:', err);
    return REAL_INDIAN_VACANCIES;
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
  const nowStr = new Date().toISOString();
  if (index >= 0) {
    jobs[index] = { ...jobs[index], ...job, updatedAt: nowStr };
    saveJobs(jobs);
    return jobs[index];
  } else {
    const newJob: Job = {
      ...job,
      postedAt: job.postedAt || nowStr,
      createdAt: job.createdAt || nowStr,
      updatedAt: nowStr,
    };
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
