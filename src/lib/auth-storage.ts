import fs from 'node:fs';
import path from 'node:path';
import { queryD1, isCloudflareD1Configured } from './cloudflare-d1';
import { getSupabaseClient } from './supabase';
import { generateSessionToken } from './auth-crypto';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  geminiApiKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  email: string;
  name: string;
  expiresAt: string;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch {
      // serverless fallback
    }
  }
}

function readLocalUsers(): UserRecord[] {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalUsers(users: UserRecord[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write local users file:', err);
  }
}

function readLocalSessions(): SessionRecord[] {
  ensureDataDir();
  if (!fs.existsSync(SESSIONS_FILE)) return [];
  try {
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalSessions(sessions: SessionRecord[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write local sessions file:', err);
  }
}

// ==========================================
// USER OPERATIONS
// ==========================================

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalized = email.trim().toLowerCase();

  // 1. Cloudflare D1
  if (isCloudflareD1Configured()) {
    try {
      const rows = await queryD1<{
        id: string;
        email: string;
        password_hash: string;
        name: string;
        gemini_api_key?: string;
        created_at: string;
        updated_at: string;
      }>('SELECT * FROM users WHERE email = ? LIMIT 1', [normalized]);

      if (rows && rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          email: r.email,
          passwordHash: r.password_hash,
          name: r.name,
          geminiApiKey: r.gemini_api_key || undefined,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        };
      }
      return null;
    } catch (err) {
      console.warn('D1 findUserByEmail failed, checking fallback:', err);
    }
  }

  // 2. Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', normalized)
        .single();
      if (!error && data) {
        return {
          id: data.id,
          email: data.email,
          passwordHash: data.password_hash,
          name: data.name,
          geminiApiKey: data.gemini_api_key || undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch {
      // fallback
    }
  }

  // 3. Local JSON fallback
  const local = readLocalUsers();
  return local.find((u) => u.email.toLowerCase() === normalized) || null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  if (!id) return null;

  // 1. Cloudflare D1
  if (isCloudflareD1Configured()) {
    try {
      const rows = await queryD1<{
        id: string;
        email: string;
        password_hash: string;
        name: string;
        gemini_api_key?: string;
        created_at: string;
        updated_at: string;
      }>('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);

      if (rows && rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          email: r.email,
          passwordHash: r.password_hash,
          name: r.name,
          geminiApiKey: r.gemini_api_key || undefined,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        };
      }
      return null;
    } catch (err) {
      console.warn('D1 findUserById failed, checking fallback:', err);
    }
  }

  // 2. Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) {
        return {
          id: data.id,
          email: data.email,
          passwordHash: data.password_hash,
          name: data.name,
          geminiApiKey: data.gemini_api_key || undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch {
      // fallback
    }
  }

  // 3. Local JSON fallback
  const local = readLocalUsers();
  return local.find((u) => u.id === id) || null;
}

export async function createUser(params: {
  email: string;
  passwordHash: string;
  name: string;
  geminiApiKey?: string;
}): Promise<UserRecord> {
  const normalized = params.email.trim().toLowerCase();
  const now = new Date().toISOString();
  const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const user: UserRecord = {
    id: userId,
    email: normalized,
    passwordHash: params.passwordHash,
    name: params.name.trim(),
    geminiApiKey: params.geminiApiKey?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };

  // 1. Cloudflare D1
  if (isCloudflareD1Configured()) {
    try {
      await queryD1(
        `INSERT INTO users (id, email, password_hash, name, gemini_api_key, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user.id, user.email, user.passwordHash, user.name, user.geminiApiKey || null, user.createdAt, user.updatedAt]
      );
    } catch (err) {
      console.warn('D1 createUser failed:', err);
    }
  }

  // 2. Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('users').insert({
        id: user.id,
        email: user.email,
        password_hash: user.passwordHash,
        name: user.name,
        gemini_api_key: user.geminiApiKey || null,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      });
    } catch (err) {
      console.warn('Supabase createUser failed:', err);
    }
  }

  // 3. Local JSON fallback
  const local = readLocalUsers();
  const existingIdx = local.findIndex((u) => u.email.toLowerCase() === normalized);
  if (existingIdx >= 0) {
    local[existingIdx] = user;
  } else {
    local.push(user);
  }
  writeLocalUsers(local);

  return user;
}

// ==========================================
// SESSION OPERATIONS
// ==========================================

export async function createSession(params: {
  userId: string;
  email: string;
  name: string;
}): Promise<string> {
  const token = generateSessionToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  const nowIso = now.toISOString();

  const session: SessionRecord = {
    token,
    userId: params.userId,
    email: params.email,
    name: params.name,
    expiresAt,
    createdAt: nowIso,
  };

  // 1. Cloudflare D1
  if (isCloudflareD1Configured()) {
    try {
      await queryD1(
        `INSERT INTO user_sessions (token, user_id, email, name, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [session.token, session.userId, session.email, session.name, session.expiresAt, session.createdAt]
      );
    } catch (err) {
      console.warn('D1 createSession failed:', err);
    }
  }

  // 2. Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('user_sessions').insert(session);
    } catch {
      // fallback
    }
  }

  // 3. Local JSON fallback
  const local = readLocalSessions();
  local.push(session);
  writeLocalSessions(local);

  return token;
}

export async function findSession(token: string): Promise<SessionRecord | null> {
  if (!token) return null;

  // 1. Cloudflare D1
  if (isCloudflareD1Configured()) {
    try {
      const rows = await queryD1<{
        token: string;
        user_id: string;
        email: string;
        name: string;
        expires_at: string;
        created_at: string;
      }>('SELECT * FROM user_sessions WHERE token = ? LIMIT 1', [token]);

      if (rows && rows.length > 0) {
        const r = rows[0];
        // Check expiration
        if (new Date(r.expires_at) < new Date()) {
          return null;
        }
        return {
          token: r.token,
          userId: r.user_id,
          email: r.email,
          name: r.name,
          expiresAt: r.expires_at,
          createdAt: r.created_at,
        };
      }
      return null;
    } catch (err) {
      console.warn('D1 findSession failed:', err);
    }
  }

  // 2. Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('token', token)
        .single();
      if (!error && data) {
        if (new Date(data.expires_at) < new Date()) {
          return null;
        }
        return data;
      }
    } catch {
      // fallback
    }
  }

  // 3. Local JSON fallback
  const local = readLocalSessions();
  const found = local.find((s) => s.token === token);
  if (found) {
    if (new Date(found.expiresAt) < new Date()) {
      return null;
    }
    return found;
  }

  return null;
}

export async function deleteSession(token: string): Promise<boolean> {
  if (!token) return false;

  // 1. Cloudflare D1
  if (isCloudflareD1Configured()) {
    try {
      await queryD1('DELETE FROM user_sessions WHERE token = ?', [token]);
    } catch {
      // fallback
    }
  }

  // 2. Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('user_sessions').delete().eq('token', token);
    } catch {
      // fallback
    }
  }

  // 3. Local JSON fallback
  const local = readLocalSessions();
  const filtered = local.filter((s) => s.token !== token);
  writeLocalSessions(filtered);

  return true;
}
