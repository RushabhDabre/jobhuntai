import { Job, UserProfile, AppSettings } from '@/types/job';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;

export function isCloudflareD1Configured(): boolean {
  return Boolean(accountId && databaseId && apiToken);
}

export async function queryD1<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  if (!isCloudflareD1Configured()) {
    throw new Error('Cloudflare D1 is not configured. Missing CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, or CLOUDFLARE_API_TOKEN.');
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sql,
      params,
    }),
    cache: 'no-store',
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    const errorDetails = data.errors?.map((e: { message: string }) => e.message).join(', ') || response.statusText;
    throw new Error(`Cloudflare D1 query failed (${response.status}): ${errorDetails}`);
  }

  const firstResult = data.result?.[0];
  if (!firstResult || !firstResult.success) {
    const errorDetails = firstResult?.error || 'Unknown D1 query execution error';
    throw new Error(`Cloudflare D1 execution failed: ${errorDetails}`);
  }

  return (firstResult.results || []) as T[];
}

export async function executeD1(sql: string, params: unknown[] = []): Promise<boolean> {
  try {
    await queryD1(sql, params);
    return true;
  } catch (err) {
    console.warn('Cloudflare D1 execute error:', err);
    return false;
  }
}

// ----------------------------------------------------
// Helpers for JSON parsing SQLite columns safely
// ----------------------------------------------------
function safeParseArray<T>(val: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // not JSON array
    }
  }
  return fallback;
}

// ----------------------------------------------------
// JOB MAPPERS & QUERIES
// ----------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function d1RowToJob(row: any): Job {
  return {
    id: row.id,
    userId: row.user_id || undefined,
    title: row.title,
    company: row.company,
    location: row.location || 'Remote',
    city: row.city || undefined,
    remoteType: row.remote_type || 'unknown',
    roleCategory: row.role_category || undefined,
    technologies: safeParseArray<string>(row.technologies),
    salary: row.salary || undefined,
    salaryInLpa: row.salary_in_lpa || row.salary || undefined,
    url: row.url || '',
    source: row.source || 'manual',
    description: row.description || '',
    requirements: safeParseArray<string>(row.requirements),
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

export async function d1GetJobs(userId?: string): Promise<Job[]> {
  if (userId) {
    const rows = await queryD1(
      'SELECT * FROM jobs WHERE user_id = ? OR user_id = ? ORDER BY posted_at DESC',
      [userId, 'default_user']
    );
    return rows.map(d1RowToJob);
  }
  const rows = await queryD1('SELECT * FROM jobs ORDER BY posted_at DESC');
  return rows.map(d1RowToJob);
}

export async function d1GetJobById(id: string): Promise<Job | undefined> {
  const rows = await queryD1('SELECT * FROM jobs WHERE id = ? LIMIT 1', [id]);
  if (!rows || rows.length === 0) return undefined;
  return d1RowToJob(rows[0]);
}

export async function d1UpsertJob(job: Job, userId?: string): Promise<Job> {
  const nowStr = new Date().toISOString();
  const targetUserId = job.userId || userId || 'default_user';
  const normalizedJob: Job = {
    ...job,
    userId: targetUserId,
    postedAt: job.postedAt || nowStr,
    createdAt: job.createdAt || nowStr,
    updatedAt: nowStr,
  };

  const sql = `
    INSERT OR REPLACE INTO jobs (
      id, user_id, title, company, location, city, remote_type, role_category,
      technologies, salary, salary_in_lpa, url, source, description,
      requirements, department, experience_required, status, match_score,
      match_analysis, cover_letter, cold_pitch, linkedin_dm, notes,
      applied_date, posted_at, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?
    )
  `;

  const params = [
    normalizedJob.id,
    targetUserId,
    normalizedJob.title,
    normalizedJob.company,
    normalizedJob.location,
    normalizedJob.city || null,
    normalizedJob.remoteType || 'unknown',
    normalizedJob.roleCategory || null,
    JSON.stringify(normalizedJob.technologies || []),
    normalizedJob.salary || null,
    normalizedJob.salaryInLpa || null,
    normalizedJob.url,
    normalizedJob.source,
    normalizedJob.description,
    JSON.stringify(normalizedJob.requirements || []),
    normalizedJob.department || null,
    normalizedJob.experienceRequired || null,
    normalizedJob.status,
    normalizedJob.matchScore ?? null,
    normalizedJob.matchAnalysis || null,
    normalizedJob.coverLetter || null,
    normalizedJob.coldPitch || null,
    normalizedJob.linkedinDm || null,
    normalizedJob.notes || '',
    normalizedJob.appliedDate || null,
    normalizedJob.postedAt,
    normalizedJob.createdAt,
    normalizedJob.updatedAt,
  ];

  await queryD1(sql, params);
  return normalizedJob;
}

export async function d1SaveJobs(jobs: Job[], userId?: string): Promise<void> {
  for (const job of jobs) {
    await d1UpsertJob(job, userId);
  }
}

export async function d1DeleteJob(id: string): Promise<boolean> {
  const res = await executeD1('DELETE FROM jobs WHERE id = ?', [id]);
  return res;
}

// ----------------------------------------------------
// USER PROFILE MAPPERS & QUERIES
// ----------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function d1RowToProfile(row: any): UserProfile {
  return {
    id: row.id,
    userId: row.id,
    name: row.name || 'Job Hunter',
    email: row.email || undefined,
    phone: row.phone || undefined,
    currentLocation: row.current_location || 'Pune, India',
    preferredLocations: safeParseArray<string>(row.preferred_locations, ['Pune', 'Mumbai', 'Hyderabad', 'Remote (India)']),
    targetTitles: safeParseArray<string>(row.target_titles, ['Software Developer', 'Fullstack Developer', 'Frontend Developer', 'React Developer']),
    preferredTechnologies: safeParseArray<string>(row.preferred_technologies, ['React', 'JavaScript', 'Java', 'C#', '.NET', 'Python']),
    yearsOfExperience: Number(row.years_of_experience) || 2,
    currentCtc: row.current_ctc || '₹7 LPA',
    expectedCtc: row.expected_ctc || '₹10 - ₹16 LPA',
    noticePeriod: row.notice_period || 'Immediate Joiner',
    preferredWorkMode: row.preferred_work_mode || 'any',
    skills: safeParseArray<string>(row.skills, ['React', 'JavaScript', 'TypeScript', 'C#', 'Java', 'SQL']),
    resumeText: row.resume_text || '',
    resumeFileName: row.resume_file_name || undefined,
    geminiApiKey: row.gemini_api_key || undefined,
    hasCompletedQuickSetup: Boolean(row.has_completed_quick_setup),
    bioNotes: row.bio_notes || undefined,
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export async function d1GetUserProfile(userId?: string): Promise<UserProfile | null> {
  const targetId = userId || 'default_user';
  const rows = await queryD1('SELECT * FROM user_profile WHERE id = ? LIMIT 1', [targetId]);
  if (!rows || rows.length === 0) {
    // If specific user not found, try default_user
    if (targetId !== 'default_user') {
      const defaultRows = await queryD1('SELECT * FROM user_profile WHERE id = ? LIMIT 1', ['default_user']);
      if (defaultRows && defaultRows.length > 0) return d1RowToProfile(defaultRows[0]);
    }
    return null;
  }
  return d1RowToProfile(rows[0]);
}

export async function d1SaveUserProfile(p: UserProfile, userId?: string): Promise<UserProfile> {
  const targetId = userId || p.email || p.id || 'default_user';
  const sql = `
    INSERT OR REPLACE INTO user_profile (
      id, name, email, phone, current_location, preferred_locations,
      target_titles, preferred_technologies, years_of_experience,
      current_ctc, expected_ctc, notice_period, preferred_work_mode,
      skills, resume_text, resume_file_name, gemini_api_key, has_completed_quick_setup,
      bio_notes, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?
    )
  `;

  const params = [
    targetId,
    p.name,
    p.email || null,
    p.phone || null,
    p.currentLocation,
    JSON.stringify(p.preferredLocations || []),
    JSON.stringify(p.targetTitles || []),
    JSON.stringify(p.preferredTechnologies || []),
    p.yearsOfExperience,
    p.currentCtc,
    p.expectedCtc,
    p.noticePeriod,
    p.preferredWorkMode,
    JSON.stringify(p.skills || []),
    p.resumeText || '',
    p.resumeFileName || null,
    p.geminiApiKey || null,
    p.hasCompletedQuickSetup ? 1 : 0,
    p.bioNotes || null,
    p.updatedAt || new Date().toISOString(),
  ];

  await queryD1(sql, params);
  return { ...p, id: targetId, userId: targetId };
}

// ----------------------------------------------------
// APP SETTINGS MAPPERS & QUERIES
// ----------------------------------------------------
export async function d1GetAppSettings(): Promise<AppSettings | null> {
  const rows = await queryD1('SELECT * FROM app_settings WHERE id = ? LIMIT 1', ['global_settings']);
  if (!rows || rows.length === 0) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = rows[0] as any;
  return {
    geminiApiKey: row.gemini_api_key || process.env.GEMINI_API_KEY || '',
    firecrawlApiKey: row.firecrawl_api_key || process.env.FIRECRAWL_API_KEY || '',
    apifyApiToken: row.apify_api_token || process.env.APIFY_API_TOKEN || '',
    defaultGeminiModel: row.default_gemini_model || 'gemini-2.5-flash',
    targetMarket: row.target_market || 'India',
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export async function d1SaveAppSettings(settings: AppSettings): Promise<AppSettings> {
  const sql = `
    INSERT OR REPLACE INTO app_settings (
      id, gemini_api_key, firecrawl_api_key, apify_api_token,
      default_gemini_model, target_market, updated_at
    ) VALUES (
      'global_settings', ?, ?, ?,
      ?, ?, ?
    )
  `;

  const params = [
    settings.geminiApiKey || null,
    settings.firecrawlApiKey || null,
    settings.apifyApiToken || null,
    settings.defaultGeminiModel || 'gemini-2.5-flash',
    settings.targetMarket || 'India',
    settings.updatedAt || new Date().toISOString(),
  ];

  await queryD1(sql, params);
  return settings;
}
