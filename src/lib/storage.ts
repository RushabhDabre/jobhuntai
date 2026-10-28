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
import { findUserById } from './auth-storage';

const DATA_DIR = path.join(process.cwd(), 'data');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');
const PROFILES_DIR = path.join(DATA_DIR, 'profiles');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch {
      // In serverless environments, fs.mkdirSync may fail if read-only
    }
  }
  if (!fs.existsSync(PROFILES_DIR)) {
    try {
      fs.mkdirSync(PROFILES_DIR, { recursive: true });
    } catch {
      // serverless fallback
    }
  }
}

function getLocalProfilePath(userId: string): string {
  const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(PROFILES_DIR, `${safeId}.json`);
}

export function getStorageMode(): 'cloudflare-d1' | 'supabase' | 'local' {
  if (isCloudflareD1Configured()) return 'cloudflare-d1';
  if (isSupabaseConfigured()) return 'supabase';
  return 'local';
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'default_user',
  name: 'Candidate',
  email: undefined,
  phone: undefined,
  currentLocation: '',
  preferredLocations: [],
  targetTitles: [],
  preferredTechnologies: [],
  yearsOfExperience: 0,
  currentCtc: '',
  expectedCtc: '',
  noticePeriod: 'Immediate Joiner',
  preferredWorkMode: 'any',
  skills: [],
  resumeText: '',
  resumeFileName: undefined,
  hasCompletedQuickSetup: false,
  bioNotes: '',
  updatedAt: new Date().toISOString(),
};

const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  firecrawlApiKey: '',
  apifyApiToken: '',
  defaultGeminiModel: 'gemini-3.8-flash',
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
  let meta: Record<string, any> = {};
  if (row.bio_notes) {
    try {
      meta = JSON.parse(row.bio_notes);
    } catch {
      // not JSON string
    }
  }

  return {
    id: row.id || 'default_user',
    userId: row.id || 'default_user',
    name: row.name || 'Candidate',
    email: row.email || undefined,
    phone: row.phone || undefined,
    currentLocation: row.current_location || '',
    preferredLocations: Array.isArray(row.preferred_locations) ? row.preferred_locations : [],
    targetTitles: Array.isArray(row.target_titles) ? row.target_titles : [],
    preferredTechnologies: Array.isArray(row.preferred_technologies) ? row.preferred_technologies : [],
    yearsOfExperience: Number(row.years_of_experience) || 0,
    currentCtc: row.current_ctc || '',
    expectedCtc: row.expected_ctc || '',
    noticePeriod: row.notice_period || 'Immediate Joiner',
    preferredWorkMode: row.preferred_work_mode || 'any',
    skills: Array.isArray(row.skills) ? row.skills : [],
    suggestedRoles: Array.isArray(row.suggested_roles)
      ? row.suggested_roles
      : Array.isArray(meta.suggestedRoles)
      ? meta.suggestedRoles
      : [],
    suggestedTechnologies: Array.isArray(row.suggested_technologies)
      ? row.suggested_technologies
      : Array.isArray(meta.suggestedTechnologies)
      ? meta.suggestedTechnologies
      : [],
    domainCategory: row.domain_category || meta.domainCategory || undefined,
    resumeText: row.resume_text || '',
    resumeFileName: row.resume_file_name || undefined,
    geminiApiKey: row.gemini_api_key || undefined,
    hasCompletedQuickSetup: Boolean(row.has_completed_quick_setup),
    bioNotes: typeof meta.bio === 'string' ? meta.bio : (row.bio_notes || undefined),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function profileToDb(p: UserProfile, userId?: string) {
  const targetId = userId || p.email || p.id || 'default_user';
  const bioNotesPayload = JSON.stringify({
    bio: p.bioNotes || '',
    suggestedRoles: p.suggestedRoles || [],
    suggestedTechnologies: p.suggestedTechnologies || [],
    domainCategory: p.domainCategory || '',
  });

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
    bio_notes: bioNotesPayload,
    updated_at: new Date().toISOString(),
  };
}

// ==========================================
// JOBS API
// ==========================================
export async function getJobs(userId?: string): Promise<Job[]> {
  if (!userId) {
    return [];
  }

  // 1. First Tier: Cloudflare D1 Serverless Database
  if (isCloudflareD1Configured()) {
    try {
      const d1Jobs = await d1GetJobs(userId);
      if (Array.isArray(d1Jobs)) {
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
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', userId)
        .order('posted_at', { ascending: false });

      if (!error && Array.isArray(data)) {
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
    return parsed.filter((j) => j.userId === userId);
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

export async function getJobById(id: string, userId?: string): Promise<Job | undefined> {
  // 1. Cloudflare D1
  if (isCloudflareD1Configured()) {
    try {
      const job = await d1GetJobById(id);
      if (job && (!userId || !job.userId || job.userId === userId)) return job;
    } catch (err) {
      console.warn('Cloudflare D1 getJobById failed, falling back:', err);
    }
  }

  // 2. Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      let query = supabase.from('jobs').select('*').eq('id', id);
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query.single();
      if (!error && data) {
        return jobFromDb(data);
      }
    } catch {
      // fallback
    }
  }

  // 3. Local JSON fallback
  ensureDataDir();
  if (!fs.existsSync(JOBS_FILE)) return undefined;
  try {
    const raw = fs.readFileSync(JOBS_FILE, 'utf-8');
    const jobs: Job[] = JSON.parse(raw);
    if (!Array.isArray(jobs)) return undefined;
    return jobs.find((j) => j.id === id && (!userId || !j.userId || j.userId === userId));
  } catch {
    return undefined;
  }
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

export async function deleteJob(id: string, userId?: string): Promise<boolean> {
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
      let query = supabase.from('jobs').delete().eq('id', id);
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { error } = await query;
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
        const filtered = jobs.filter((j) => {
          if (j.id !== id) return true;
          if (userId && j.userId && j.userId !== userId) return true;
          return false;
        });
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

  if (!userId || userId === 'default_user') {
    return {
      ...DEFAULT_PROFILE,
      id: targetId,
      userId: targetId,
    };
  }

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

  // 3. Local isolated user JSON fallback
  ensureDataDir();
  const userProfileFile = getLocalProfilePath(targetId);
  if (fs.existsSync(userProfileFile)) {
    try {
      const raw = fs.readFileSync(userProfileFile, 'utf-8');
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PROFILE, ...parsed, id: targetId, userId: targetId };
    } catch {
      // continue
    }
  }

  // 4. Prepopulate from auth account if newly registered user
  try {
    const authUser = await findUserById(targetId);
    if (authUser) {
      return {
        ...DEFAULT_PROFILE,
        id: targetId,
        userId: targetId,
        name: authUser.name || 'Candidate',
        email: authUser.email,
      };
    }
  } catch {
    // continue
  }

  return { ...DEFAULT_PROFILE, id: targetId, userId: targetId };
}

export async function saveUserProfile(profile: Partial<UserProfile>, userId?: string): Promise<UserProfile> {
  const targetId = userId || profile.userId || profile.id || 'default_user';
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

  // 3. Local JSON fallback - isolated per-user file
  ensureDataDir();
  try {
    const userProfileFile = getLocalProfilePath(targetId);
    fs.writeFileSync(userProfileFile, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write to local user profile file:', err);
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
        const rawModel = data.default_gemini_model;
        const normalizedModel = (!rawModel || rawModel.startsWith('gemini-2.') || rawModel.startsWith('gemini-1.'))
          ? 'gemini-3.8-flash'
          : rawModel;
        return {
          geminiApiKey: data.gemini_api_key || '',
          firecrawlApiKey: data.firecrawl_api_key || '',
          apifyApiToken: data.apify_api_token || '',
          defaultGeminiModel: normalizedModel,
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
    const rawModel = parsed.defaultGeminiModel;
    const normalizedModel = (!rawModel || rawModel.startsWith('gemini-2.') || rawModel.startsWith('gemini-1.'))
      ? 'gemini-3.8-flash'
      : rawModel;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      defaultGeminiModel: normalizedModel,
      geminiApiKey: parsed.geminiApiKey || '',
      firecrawlApiKey: parsed.firecrawlApiKey || '',
      apifyApiToken: parsed.apifyApiToken || '',
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
