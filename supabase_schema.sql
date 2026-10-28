-- ========================================================
-- JobHunt AI: Supabase Database Schema
-- Run this in your Supabase Project -> SQL Editor -> Run
-- ========================================================

-- 1. Table for Job Openings & Pipeline Tracking
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT DEFAULT 'Remote',
  city TEXT,
  remote_type TEXT DEFAULT 'unknown',
  role_category TEXT,
  technologies JSONB DEFAULT '[]'::jsonb,
  salary TEXT,
  salary_in_lpa TEXT,
  url TEXT DEFAULT '',
  source TEXT DEFAULT 'manual',
  description TEXT DEFAULT '',
  requirements JSONB DEFAULT '[]'::jsonb,
  department TEXT,
  experience_required TEXT,
  status TEXT DEFAULT 'discovered',
  match_score INTEGER,
  match_analysis JSONB,
  cover_letter TEXT,
  cold_pitch TEXT,
  linkedin_dm TEXT,
  notes TEXT,
  applied_date TEXT,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast status & date queries
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at DESC);

-- 2. Table for Candidate Profile & Resume
CREATE TABLE IF NOT EXISTS user_profile (
  id TEXT PRIMARY KEY DEFAULT 'default_user',
  name TEXT DEFAULT 'Candidate',
  email TEXT,
  phone TEXT,
  current_location TEXT DEFAULT 'Pune, India',
  preferred_locations JSONB DEFAULT '["Pune", "Mumbai", "Hyderabad", "Remote (India)"]'::jsonb,
  target_titles JSONB DEFAULT '["Software Developer", "Fullstack Developer", "Frontend Developer", "React Developer"]'::jsonb,
  preferred_technologies JSONB DEFAULT '["React", "JavaScript", "Java", "C#", ".NET", "Python"]'::jsonb,
  years_of_experience NUMERIC DEFAULT 2,
  current_ctc TEXT DEFAULT '₹7 LPA',
  expected_ctc TEXT DEFAULT '₹10 - ₹16 LPA',
  notice_period TEXT DEFAULT 'Immediate Joiner',
  preferred_work_mode TEXT DEFAULT 'any',
  skills JSONB DEFAULT '["React", "JavaScript", "C#", "Java", "SQL"]'::jsonb,
  resume_text TEXT DEFAULT '',
  resume_file_name TEXT,
  has_completed_quick_setup BOOLEAN DEFAULT FALSE,
  bio_notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table for App Settings & API Keys
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY DEFAULT 'global_settings',
  gemini_api_key TEXT,
  firecrawl_api_key TEXT,
  apify_api_token TEXT,
  default_gemini_model TEXT DEFAULT 'gemini-2.5-flash',
  target_market TEXT DEFAULT 'India',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) but allow public access for your personal app
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Simple personal access policies (allows your app with Anon or Service Role key to read/write)
DROP POLICY IF EXISTS "Public access to jobs" ON jobs;
CREATE POLICY "Public access to jobs" ON jobs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to user_profile" ON user_profile;
CREATE POLICY "Public access to user_profile" ON user_profile FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to app_settings" ON app_settings;
CREATE POLICY "Public access to app_settings" ON app_settings FOR ALL USING (true) WITH CHECK (true);
