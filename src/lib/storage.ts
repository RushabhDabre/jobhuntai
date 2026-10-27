import fs from 'node:fs';
import path from 'node:path';
import { Job, UserProfile, AppSettings } from '@/types/job';
import {
  isCloudflareD1Configured,
  d1GetJobs,
  d1GetJobById,
  d1UpsertJob,
  d1SaveJobs,
  d1DeleteJob,
  d1GetUserProfile,
  d1SaveUserProfile,
  d1GetAppSettings,
  d1SaveAppSettings,
} from './cloudflare-d1';
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

export function getStorageMode(): 'cloudflare-d1' | 'supabase' | 'local' {
  if (isCloudflareD1Configured()) return 'cloudflare-d1';
  if (isSupabaseConfigured()) return 'supabase';
  return 'local';
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'default_user',
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
    'Git',
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
    userId: row.user_id || undefined,
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

function jobToDb(job: Job, userId?: string) {
  return {
    id: job.id,
    user_id: job.userId || userId || 'default_user',
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
    id: row.id || 'default_user',
    userId: row.id || 'default_user',
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
    geminiApiKey: row.gemini_api_key || undefined,
    hasCompletedQuickSetup: Boolean(row.has_completed_quick_setup),
    bioNotes: row.bio_notes || undefined,
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function profileToDb(p: UserProfile, userId?: string) {
  const targetId = userId || p.email || p.id || 'default_user';
  return {
    id: targetId,
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
    gemini_api_key: p.geminiApiKey || null,
    has_completed_quick_setup: p.hasCompletedQuickSetup,
    bio_notes: p.bioNotes,
    updated_at: new Date().toISOString(),
  };
}

// ==========================================
// JOBS API
// ==========================================
export async function getJobs(userId?: string): Promise<Job[]> {
  // 1. First Tier: Cloudflare D1 Serverless Database
  if (isCloudflareD1Configured()) {
    try {
      const d1Jobs = await d1GetJobs(userId);
      if (Array.isArray(d1Jobs) && d1Jobs.length > 0) {
        return d1Jobs;
      }
    } catch (err) {
      console.warn('Cloudflare D1 query failed, falling back:', err);
    }
  }

  // 2. Second Tier: Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      let query = supabase.from('jobs').select('*').order('posted_at', { ascending: false });
      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.eq.default_user`);
      }
      const { data, error } = await query;

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map(jobFromDb);
      }
    } catch (err) {
      console.warn('Supabase query failed, falling back to local storage:', err);
    }
  }

  // 3. Third Tier: Local JSON fallback
  ensureDataDir();
  if (!fs.existsSync(JOBS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(JOBS_FILE, 'utf-8');
    const parsed: Job[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    if (!userId) return parsed;
    return parsed.filter((j) => !j.userId || j.userId === userId || j.userId === 'default_user');
  } catch {
    return [];
  }
}

export async function saveJobs(jobs: Job[], userId?: string): Promise<void> {
  // 1. Cloudflare D1
  if (isCloudflareD1Configured()) {
    try {
      await d1SaveJobs(jobs, userId);
    } catch (err) {
      console.warn('Cloudflare D1 saveJobs failed:', err);
    }
  }

  // 2. Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const rows = jobs.map((j) => jobToDb(j, userId));
      await supabase.from('jobs').upsert(rows);
    } catch (err) {
      console.warn('Supabase saveJobs failed:', err);
    }
  }

  // 3. Local JSON fallback
  ensureDataDir();
  try {
    fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write to local jobs file (normal on read-only serverless):', err);
  }
}

export async function getJobById(id: string): Promise<Job | undefined> {
  // 1. Cloudflare D1
  if (isCloudflareD1Configured()) {
    try {
      const job = await d1GetJobById(id);
      if (job) return job;
    } catch (err) {
      console.warn('Cloudflare D1 getJobById failed, falling back:', err);
    }
  }

  // 2. Supabase
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

  // 3. Local JSON fallback
  const jobs = await getJobs();
  return jobs.find((j) => j.id === id);
}

export async function upsertJob(job: Job, userId?: string): Promise<Job> {
  const nowStr = new Date().toISOString();
  const normalizedJob: Job = {
    ...job,
    userId: job.userId || userId || 'default_user',
    postedAt: job.postedAt || nowStr,
    createdAt: job.createdAt || nowStr,
    updatedAt: nowStr,
  };

  // 1. Cloudflare D1
  if (isCloudflareD1Configured()) {
    try {
      await d1UpsertJob(normalizedJob, userId);
    } catch (err) {
      console.warn('Cloudflare D1 upsertJob failed:', err);
    }
  }

  // 2. Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const row = jobToDb(normalizedJob, userId);
      await supabase.from('jobs').upsert(row);
    } catch (err) {
      console.warn('Supabase upsertJob failed:', err);
    }
  }

  // 3. Local JSON fallback
  try {
    ensureDataDir();
    let jobs: Job[] = [];
    if (fs.existsSync(JOBS_FILE)) {
      try {
        const raw = fs.readFileSync(JOBS_FILE, 'utf-8');
        jobs = JSON.parse(raw);
        if (!Array.isArray(jobs)) jobs = [];
      } catch {
        jobs = [];
      }
    }
    const index = jobs.findIndex((j) => j.id === normalizedJob.id);
    if (index >= 0) {
      jobs[index] = { ...jobs[index], ...normalizedJob };
    } else {
      jobs.unshift(normalizedJob);
    }
    fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Local JSON upsertJob write skipped:', err);
  }

  return normalizedJob;
}

export async function deleteJob(id: string): Promise<boolean> {
  let deleted = false;

  // 1. Cloudflare D1
  if (isCloudflareD1Configured()) {
    try {
      deleted = await d1DeleteJob(id);
    } catch (err) {
      console.warn('Cloudflare D1 deleteJob failed:', err);
    }
  }

  // 2. Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('jobs').delete().eq('id', id);
      if (!error) deleted = true;
    } catch {
      // fallback
    }
  }

  // 3. Local JSON fallback
  try {
    ensureDataDir();
    if (fs.existsSync(JOBS_FILE)) {
      const raw = fs.readFileSync(JOBS_FILE, 'utf-8');
      const jobs: Job[] = JSON.parse(raw);
      if (Array.isArray(jobs)) {
        const filtered = jobs.filter((j) => j.id !== id);
        if (filtered.length !== jobs.length) {
          fs.writeFileSync(JOBS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
          deleted = true;
        }
      }
    }
  } catch (err) {
    console.warn('Local JSON deleteJob skipped:', err);
  }

  return deleted;
}

// ==========================================
// PROFILE API
// ==========================================
export async function getUserProfile(userId?: string): Promise<UserProfile> {
  const targetId = userId || 'default_user';

  // 1. Cloudflare D1
  if (isCloudflareD1Configured()) {
    try {
      const profile = await d1GetUserProfile(targetId);
      if (profile) return profile;
    } catch (err) {
      console.warn('Cloudflare D1 getUserProfile failed, falling back:', err);
    }
  }

  // 2. Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .eq('id', targetId)
        .single();
      if (!error && data) {
        return profileFromDb(data);
      }
    } catch {
      // fallback
    }
  }

  // 3. Local JSON fallback
  ensureDataDir();
  if (!fs.existsSync(PROFILE_FILE)) {
    return { ...DEFAULT_PROFILE, id: targetId, userId: targetId };
  }
  try {
    const raw = fs.readFileSync(PROFILE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROFILE, ...parsed, id: targetId, userId: targetId };
  } catch {
    return { ...DEFAULT_PROFILE, id: targetId, userId: targetId };
  }
}

export async function saveUserProfile(profile: Partial<UserProfile>, userId?: string): Promise<UserProfile> {
  const targetId = userId || profile.email || profile.id || 'default_user';
  const current = await getUserProfile(targetId);
  const updated: UserProfile = {
    ...current,
    ...profile,
    id: targetId,
    userId: targetId,
    updatedAt: new Date().toISOString(),
  };

  // 1. Cloudflare D1
  if (isCloudflareD1Configured()) {
    try {
      await d1SaveUserProfile(updated, targetId);
    } catch (err) {
      console.warn('Cloudflare D1 saveUserProfile failed:', err);
    }
  }

  // 2. Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const row = profileToDb(updated, targetId);
      await supabase.from('user_profile').upsert(row);
    } catch (err) {
      console.warn('Supabase saveUserProfile failed:', err);
    }
  }

  // 3. Local JSON fallback
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
  // 1. Cloudflare D1
  if (isCloudflareD1Configured()) {
    try {
      const settings = await d1GetAppSettings();
      if (settings) return settings;
    } catch (err) {
      console.warn('Cloudflare D1 getAppSettings failed, falling back:', err);
    }
  }

  // 2. Supabase
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

  // 3. Local JSON fallback
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

  // 1. Cloudflare D1
  if (isCloudflareD1Configured()) {
    try {
      await d1SaveAppSettings(updated);
    } catch (err) {
      console.warn('Cloudflare D1 saveAppSettings failed:', err);
    }
  }

  // 2. Supabase
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

  // 3. Local JSON fallback
  ensureDataDir();
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write to local settings file (normal on read-only serverless):', err);
  }

  return updated;
}
