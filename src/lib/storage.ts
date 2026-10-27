import fs from 'node:fs';
import path from 'node:path';
import { Job, UserProfile, AppSettings } from '@/types/job';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

const DATA_DIR = path.join(process.cwd(), 'data');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');
const PROFILE_FILE = path.join(DATA_DIR, 'profile.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch {
      // In serverless environments, fs.mkdirSync may fail if read-only
    }
  }
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Rushabh Dabare',
  email: 'rushabhdabare2001@gmail.com',
  phone: '9067015129',
  currentLocation: 'Pune, India',
  preferredLocations: ['Pune', 'Mumbai', 'Hyderabad', 'Remote (India)'],
  targetTitles: ['Software Developer', 'Fullstack Developer', 'Frontend Developer', 'React Developer'],
  preferredTechnologies: ['React', 'JavaScript', 'Java', 'C#', '.NET', 'Python'],
  yearsOfExperience: 2,
  currentCtc: '₹7 LPA',
  expectedCtc: '₹10 - ₹16 LPA',
  noticePeriod: 'Immediate Joiner',
  preferredWorkMode: 'any',
  skills: [
    'React',
    'JavaScript',
    'TypeScript',
    'C#',
    'Java',
    'SQL',
    'ASP.NET Core Web API',
    'Spring Boot',
    'Node.js',
    'REST APIs',
    'Git'
  ],
  resumeText: `RUSHABH DABARE
Software Developer | Pune, Maharashtra | +91 9067015129 | Notice: Immediate Joiner

SUMMARY:
2+ years of software development experience specializing in web applications using React, JavaScript, C#, Java, and modern REST APIs. Hands-on experience developing frontends, working with relational databases, and debugging production issues.`,
  hasCompletedQuickSetup: true,
  bioNotes: 'Looking for active vacancies in Pune, Mumbai, or Hyderabad.',
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

// Database <-> TypeScript mappers for Supabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function jobFromDb(row: any): Job {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location || 'Remote',
    city: row.city || undefined,
    remoteType: row.remote_type || 'unknown',
    roleCategory: row.role_category || undefined,
    technologies: Array.isArray(row.technologies) ? row.technologies : [],
    salary: row.salary || undefined,
    salaryInLpa: row.salary_in_lpa || row.salary || undefined,
    url: row.url || '',
    source: row.source || 'manual',
    description: row.description || '',
    requirements: Array.isArray(row.requirements) ? row.requirements : [],
    department: row.department || undefined,
    experienceRequired: row.experience_required || undefined,
    status: row.status || 'discovered',
    matchScore: typeof row.match_score === 'number' ? row.match_score : undefined,
    matchAnalysis: row.match_analysis || undefined,
    coverLetter: row.cover_letter || undefined,
    coldPitch: row.cold_pitch || undefined,
    linkedinDm: row.linkedin_dm || undefined,
    notes: row.notes || '',
    appliedDate: row.applied_date || undefined,
    postedAt: row.posted_at || row.created_at || new Date().toISOString(),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function jobToDb(job: Job) {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    city: job.city,
    remote_type: job.remoteType,
    role_category: job.roleCategory,
    technologies: job.technologies || [],
    salary: job.salary,
    salary_in_lpa: job.salaryInLpa,
    url: job.url,
    source: job.source,
    description: job.description,
    requirements: job.requirements || [],
    department: job.department,
    experience_required: job.experienceRequired,
    status: job.status,
    match_score: job.matchScore,
    match_analysis: job.matchAnalysis,
    cover_letter: job.coverLetter,
    cold_pitch: job.coldPitch,
    linkedin_dm: job.linkedinDm,
    notes: job.notes,
    applied_date: job.appliedDate,
    posted_at: job.postedAt || new Date().toISOString(),
    created_at: job.createdAt || new Date().toISOString(),
    updated_at: job.updatedAt || new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function profileFromDb(row: any): UserProfile {
  return {
    name: row.name || DEFAULT_PROFILE.name,
    email: row.email || undefined,
    phone: row.phone || undefined,
    currentLocation: row.current_location || DEFAULT_PROFILE.currentLocation,
    preferredLocations: Array.isArray(row.preferred_locations) ? row.preferred_locations : DEFAULT_PROFILE.preferredLocations,
    targetTitles: Array.isArray(row.target_titles) ? row.target_titles : DEFAULT_PROFILE.targetTitles,
    preferredTechnologies: Array.isArray(row.preferred_technologies) ? row.preferred_technologies : DEFAULT_PROFILE.preferredTechnologies,
    yearsOfExperience: Number(row.years_of_experience) || 2,
    currentCtc: row.current_ctc || DEFAULT_PROFILE.currentCtc,
    expectedCtc: row.expected_ctc || DEFAULT_PROFILE.expectedCtc,
    noticePeriod: row.notice_period || DEFAULT_PROFILE.noticePeriod,
    preferredWorkMode: row.preferred_work_mode || 'any',
    skills: Array.isArray(row.skills) ? row.skills : DEFAULT_PROFILE.skills,
    resumeText: row.resume_text || '',
    resumeFileName: row.resume_file_name || undefined,
    hasCompletedQuickSetup: Boolean(row.has_completed_quick_setup),
    bioNotes: row.bio_notes || undefined,
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function profileToDb(p: UserProfile) {
  return {
    id: 'default_user',
    name: p.name,
    email: p.email,
    phone: p.phone,
    current_location: p.currentLocation,
    preferred_locations: p.preferredLocations || [],
    target_titles: p.targetTitles || [],
    preferred_technologies: p.preferredTechnologies || [],
    years_of_experience: p.yearsOfExperience,
    current_ctc: p.currentCtc,
    expected_ctc: p.expectedCtc,
    notice_period: p.noticePeriod,
    preferred_work_mode: p.preferredWorkMode,
    skills: p.skills || [],
    resume_text: p.resumeText || '',
    resume_file_name: p.resumeFileName,
    has_completed_quick_setup: p.hasCompletedQuickSetup,
    bio_notes: p.bioNotes,
    updated_at: new Date().toISOString(),
  };
}

// ==========================================
// JOBS API
// ==========================================
export async function getJobs(): Promise<Job[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('posted_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map(jobFromDb);
      }
    } catch (err) {
      console.warn('Supabase query failed, falling back to local storage:', err);
    }
  }

  // Local JSON fallback
  ensureDataDir();
  if (!fs.existsSync(JOBS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(JOBS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveJobs(jobs: Job[]): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const rows = jobs.map(jobToDb);
      await supabase.from('jobs').upsert(rows);
    } catch (err) {
      console.warn('Supabase saveJobs failed:', err);
    }
  }

  ensureDataDir();
  try {
    fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write to local jobs file (normal on read-only serverless):', err);
  }
}

export async function getJobById(id: string): Promise<Job | undefined> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) {
        return jobFromDb(data);
      }
    } catch {
      // fallback
    }
  }

  const jobs = await getJobs();
  return jobs.find((j) => j.id === id);
}

export async function upsertJob(job: Job): Promise<Job> {
  const nowStr = new Date().toISOString();
  const normalizedJob: Job = {
    ...job,
    postedAt: job.postedAt || nowStr,
    createdAt: job.createdAt || nowStr,
    updatedAt: nowStr,
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const row = jobToDb(normalizedJob);
      const { error } = await supabase.from('jobs').upsert(row);
      if (!error) {
        return normalizedJob;
      }
    } catch (err) {
      console.warn('Supabase upsertJob failed, saving to local JSON:', err);
    }
  }

  // Local JSON fallback
  const jobs = await getJobs();
  const index = jobs.findIndex((j) => j.id === normalizedJob.id);
  if (index >= 0) {
    jobs[index] = { ...jobs[index], ...normalizedJob };
  } else {
    jobs.unshift(normalizedJob);
  }
  await saveJobs(jobs);
  return normalizedJob;
}

export async function deleteJob(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('jobs').delete().eq('id', id);
      if (!error) return true;
    } catch {
      // fallback
    }
  }

  const jobs = await getJobs();
  const filtered = jobs.filter((j) => j.id !== id);
  if (filtered.length !== jobs.length) {
    await saveJobs(filtered);
    return true;
  }
  return false;
}

// ==========================================
// PROFILE API
// ==========================================
export async function getUserProfile(): Promise<UserProfile> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .eq('id', 'default_user')
        .single();
      if (!error && data) {
        return profileFromDb(data);
      }
    } catch {
      // fallback
    }
  }

  // Local JSON fallback
  ensureDataDir();
  if (!fs.existsSync(PROFILE_FILE)) {
    return DEFAULT_PROFILE;
  }
  try {
    const raw = fs.readFileSync(PROFILE_FILE, 'utf-8');
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export async function saveUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const current = await getUserProfile();
  const updated: UserProfile = {
    ...current,
    ...profile,
    updatedAt: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const row = profileToDb(updated);
      await supabase.from('user_profile').upsert(row);
    } catch (err) {
      console.warn('Supabase saveUserProfile failed:', err);
    }
  }

  ensureDataDir();
  try {
    fs.writeFileSync(PROFILE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write to local profile file (normal on read-only serverless):', err);
  }

  return updated;
}

// ==========================================
// SETTINGS API
// ==========================================
export async function getAppSettings(): Promise<AppSettings> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 'global_settings')
        .single();
      if (!error && data) {
        return {
          geminiApiKey: data.gemini_api_key || process.env.GEMINI_API_KEY || '',
          firecrawlApiKey: data.firecrawl_api_key || process.env.FIRECRAWL_API_KEY || '',
          apifyApiToken: data.apify_api_token || process.env.APIFY_API_TOKEN || '',
          defaultGeminiModel: data.default_gemini_model || 'gemini-2.5-flash',
          targetMarket: data.target_market || 'India',
          updatedAt: data.updated_at || new Date().toISOString(),
        };
      }
    } catch {
      // fallback
    }
  }

  ensureDataDir();
  if (!fs.existsSync(SETTINGS_FILE)) {
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
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveAppSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getAppSettings();
  const updated: AppSettings = {
    ...current,
    ...settings,
    updatedAt: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('app_settings').upsert({
        id: 'global_settings',
        gemini_api_key: updated.geminiApiKey,
        firecrawl_api_key: updated.firecrawlApiKey,
        apify_api_token: updated.apifyApiToken,
        default_gemini_model: updated.defaultGeminiModel,
        target_market: updated.targetMarket,
        updated_at: updated.updatedAt,
      });
    } catch (err) {
      console.warn('Supabase saveAppSettings failed:', err);
    }
  }

  ensureDataDir();
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write to local settings file (normal on read-only serverless):', err);
  }

  return updated;
}
