-- ====================================================================
-- Cloudflare D1 Database Schema for JobHuntAI (Production Edition)
-- ====================================================================
-- To set up or update your free Cloudflare D1 database:
-- 1. Log in to Cloudflare Dashboard (dash.cloudflare.com)
-- 2. Go to "Workers & Pages" -> "D1 SQL Database" -> "jobhuntai-db"
-- 3. Open the "Console" tab and paste this entire file, then click "Execute"
-- ====================================================================

-- 1. Users Table (Production Password Authentication)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  gemini_api_key TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- 2. User Sessions Table (Persistent Sessions across Devices)
CREATE TABLE IF NOT EXISTS user_sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions (expires_at);

-- 3. Jobs Table (User-scoped)
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT DEFAULT 'default_user',
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  city TEXT,
  remote_type TEXT,
  role_category TEXT,
  technologies TEXT, -- JSON stringified array: ["React", "Java"]
  salary TEXT,
  salary_in_lpa TEXT,
  url TEXT,
  source TEXT,
  description TEXT,
  requirements TEXT, -- JSON stringified array
  department TEXT,
  experience_required TEXT,
  status TEXT DEFAULT 'discovered',
  match_score REAL,
  match_analysis TEXT,
  cover_letter TEXT,
  cold_pitch TEXT,
  linkedin_dm TEXT,
  notes TEXT,
  applied_date TEXT,
  posted_at TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs (user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs (posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_city ON jobs (city);

-- 4. User Profile Table (User-scoped)
CREATE TABLE IF NOT EXISTS user_profile (
  id TEXT PRIMARY KEY DEFAULT 'default_user',
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  current_location TEXT,
  preferred_locations TEXT, -- JSON stringified array: ["Pune", "Mumbai"]
  target_titles TEXT, -- JSON stringified array: ["Software Developer"]
  preferred_technologies TEXT, -- JSON stringified array: ["React", "Java"]
  years_of_experience INTEGER DEFAULT 2,
  current_ctc TEXT,
  expected_ctc TEXT,
  notice_period TEXT,
  preferred_work_mode TEXT,
  skills TEXT, -- JSON stringified array: ["React", "Node"]
  resume_text TEXT,
  resume_file_name TEXT,
  gemini_api_key TEXT,
  has_completed_quick_setup INTEGER DEFAULT 0,
  bio_notes TEXT,
  updated_at TEXT
);

-- 5. App Settings Table
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY DEFAULT 'global_settings',
  gemini_api_key TEXT,
  firecrawl_api_key TEXT,
  apify_api_token TEXT,
  default_gemini_model TEXT DEFAULT 'gemini-3.8-flash',
  target_market TEXT DEFAULT 'India',
  updated_at TEXT
);
