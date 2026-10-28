'use client';

import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, AiProvider } from '@/types/job';
import { getAuthHeaders, getStoredSession } from '@/lib/auth';
import {
  User,
  Sparkles,
  Save,
  Check,
  Plus,
  X,
  FileText,
  MapPin,
  Briefcase,
  IndianRupee,
  Clock,
  UploadCloud,
  Loader2,
  AlertCircle,
  FileCheck,
  Key,
  ExternalLink,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  Cpu,
  Layers,
  ArrowRightLeft,
} from 'lucide-react';

const INDIAN_CITIES = [
  'Bengaluru',
  'Hyderabad',
  'Pune',
  'Delhi NCR (Gurgaon/Noida)',
  'Mumbai',
  'Chennai',
  'Remote (India)',
];

const NOTICE_PERIOD_OPTIONS = [
  'Immediate Joiner',
  '15 Days',
  '30 Days',
  '60 Days',
  '90 Days',
  'Serving Notice',
] as const;

export default function ProfileView() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newSkill, setNewSkill] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/profile', { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProfile(data.profile);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  // Resume File Upload handler (PDF, DOCX, TXT)
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const activeKey =
      profile?.geminiApiKey?.trim() ||
      profile?.groqApiKey?.trim() ||
      profile?.openRouterApiKey?.trim() ||
      profile?.openaiApiKey?.trim();

    if (!activeKey) {
      setUploadMessage({
        type: 'error',
        text: 'Please connect at least one AI API key (Google Gemini, Groq, or OpenRouter) in the AI Engines section below before uploading a resume.',
      });
      return;
    }

    setUploadingResume(true);
    setUploadMessage(null);

    const session = getStoredSession();
    const userId = session?.id || profile?.userId || profile?.id;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('apiKey', activeKey);
    if (userId) {
      formData.append('userId', userId);
    }

    try {
      const headers = getAuthHeaders();
      if (userId) {
        headers['x-user-id'] = userId;
      }
      const res = await fetch('/api/profile/upload-resume', {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await res.json();
      if (!data.success) {
        if (data.formattedError) {
          setUploadMessage({
            type: 'error',
            text: data.formattedError.message || data.error || 'Failed to parse resume',
          });
          return;
        }
        throw new Error(data.error || 'Failed to upload and parse resume');
      }

      setProfile(data.profile);
      setUploadMessage({
        type: 'success',
        text: `Resume "${file.name}" uploaded and parsed with Gemini! Profile updated.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setUploadMessage({ type: 'error', text: msg });
    } finally {
      setUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleCityPreference = (city: string) => {
    if (!profile) return;
    const current = profile.preferredLocations || [];
    const exists = current.includes(city);
    const updated = exists ? current.filter((c) => c !== city) : [...current, city];
    setProfile({ ...profile, preferredLocations: updated });
  };

  const addSkill = () => {
    if (!newSkill.trim() || !profile) return;
    if (!profile.skills.includes(newSkill.trim())) {
      setProfile({
        ...profile,
        skills: [...profile.skills, newSkill.trim()],
      });
    }
    setNewSkill('');
  };

  const removeSkill = (skillToRemove: string) => {
    if (!profile) return;
    setProfile({
      ...profile,
      skills: profile.skills.filter((s) => s !== skillToRemove),
    });
  };

  const addTargetTitle = () => {
    if (!newTitle.trim() || !profile) return;
    if (!profile.targetTitles.includes(newTitle.trim())) {
      setProfile({
        ...profile,
        targetTitles: [...profile.targetTitles, newTitle.trim()],
      });
    }
    setNewTitle('');
  };

  const removeTargetTitle = (titleToRemove: string) => {
    if (!profile) return;
    setProfile({
      ...profile,
      targetTitles: profile.targetTitles.filter((t) => t !== titleToRemove),
    });
  };

  if (loading || !profile) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
        <p className="text-sm text-zinc-500 mt-2 font-medium">Loading candidate profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              🇮🇳 India Job Market Profile
            </span>
            {profile.resumeFileName && (
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5 text-indigo-500" />
                {profile.resumeFileName}
              </span>
            )}
            {profile.domainCategory && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Domain: {profile.domainCategory}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Your Candidate & Search Profile
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-xl">
            Upload your resume and define your target locations, CTC expectations, and notice period. Gemini uses this profile to evaluate every job.
          </p>
        </div>

        <button
          onClick={() => handleSave()}
          disabled={saving}
          className="self-start sm:self-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : savedSuccess ? (
            <Check className="w-4 h-4 text-emerald-300" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{savedSuccess ? 'Profile Saved!' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Upload Resume Box */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Upload Resume (PDF, DOCX, TXT)
              </h2>
              <p className="text-xs text-zinc-500">
                Gemini automatically extracts your skills, experience, and projects from your PDF file.
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
        </div>

        {uploadMessage && (
          <div
            className={`flex items-center gap-2 p-3.5 rounded-xl text-xs sm:text-sm ${
              uploadMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {uploadMessage.type === 'success' ? (
              <FileCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{uploadMessage.text}</span>
          </div>
        )}

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) handleFileUpload(file);
          }}
          className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl p-8 text-center cursor-pointer transition-colors bg-zinc-50/50 dark:bg-zinc-800/20"
        >
          {uploadingResume ? (
            <div className="space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Parsing resume with Gemini AI...
              </p>
              <p className="text-xs text-zinc-500">Extracting tech stack, experience, and contact details</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <UploadCloud className="w-8 h-8 mx-auto text-zinc-400" />
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Click to browse or drag and drop your Resume PDF
              </p>
              <p className="text-xs text-zinc-500">
                Supports PDF, DOCX, or Markdown up to 10MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Private Multi-AI Engine & Failover Settings */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Personal AI Engines & Keys</span>
                {(profile.geminiApiKey || profile.groqApiKey || profile.openRouterApiKey) ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Ready
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Key Required
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-500">
                Connect your free AI keys. Automatic failover switches engines seamlessly if rate limits (429) or high demand (503) occur.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.autoFailover !== false}
                onChange={(e) => setProfile({ ...profile, autoFailover: e.target.checked })}
                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <ArrowRightLeft className="w-3 h-3 text-indigo-500" /> Auto-Failover
              </span>
            </label>
          </div>
        </div>

        {/* Engine Priority Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-500" />
            <span>Primary AI Provider:</span>
          </label>
          <select
            value={profile.preferredAiProvider || 'gemini'}
            onChange={(e) => setProfile({ ...profile, preferredAiProvider: e.target.value as AiProvider })}
            className="text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 font-medium"
          >
            <option value="gemini">Google Gemini (Recommended, 1M context)</option>
            <option value="groq">Groq Cloud (Free Llama 3.3 70B, 300+ tok/s)</option>
            <option value="openrouter">OpenRouter (Free Tier Models)</option>
            <option value="openai">OpenAI (GPT-4o-mini)</option>
            <option value="claude">Anthropic (Claude 3.5 Haiku)</option>
          </select>
        </div>

        {/* 1. Google Gemini Key */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Google Gemini Key</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                FREE
              </span>
            </label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>Get Free Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="relative">
            <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type={showApiKey ? 'text' : 'password'}
              placeholder="AIzaSy... (Paste Gemini key here)"
              value={profile.geminiApiKey || ''}
              onChange={(e) => setProfile({ ...profile, geminiApiKey: e.target.value.trim() })}
              className="w-full text-xs pl-9 pr-20 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-zinc-900 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer flex items-center gap-1"
            >
              {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showApiKey ? 'Hide' : 'Show'}</span>
            </button>
          </div>
        </div>

        {/* 2. Groq Key */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Groq Cloud Key (Llama 3.3 70B)</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                FREE & ULTRA FAST
              </span>
            </label>
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:underline"
            >
              <span>console.groq.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="relative">
            <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="password"
              placeholder="gsk_... (Paste free Groq key here)"
              value={profile.groqApiKey || ''}
              onChange={(e) => setProfile({ ...profile, groqApiKey: e.target.value.trim() })}
              className="w-full text-xs pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>

        {/* 3. OpenRouter Key */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-500" />
              <span>OpenRouter Key</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                FREE MODELS
              </span>
            </label>
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-600 dark:text-purple-400 hover:underline"
            >
              <span>openrouter.ai</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="relative">
            <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="password"
              placeholder="sk-or-v1-... (Paste OpenRouter key here)"
              value={profile.openRouterApiKey || ''}
              onChange={(e) => setProfile({ ...profile, openRouterApiKey: e.target.value.trim() })}
              className="w-full text-xs pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>

        <p className="text-[11px] text-zinc-400 pt-1">
          🔒 <strong>Strict Account Isolation:</strong> All keys are stored strictly inside your personal user profile. Never shared with or used by any other candidate.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Indian Market Career Criteria */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              India Hiring & Compensation Details
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Crucial parameters recruiters look for when screening Indian candidates.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Current CTC (₹ LPA)
              </label>
              <input
                type="text"
                placeholder="e.g. ₹18 LPA"
                value={profile.currentCtc || ''}
                onChange={(e) => setProfile({ ...profile, currentCtc: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Expected CTC (₹ LPA) *
              </label>
              <input
                type="text"
                placeholder="e.g. ₹28 - ₹35 LPA"
                value={profile.expectedCtc || ''}
                onChange={(e) => setProfile({ ...profile, expectedCtc: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Notice Period *
              </label>
              <select
                value={profile.noticePeriod || '30 Days'}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    noticePeriod: e.target.value as UserProfile['noticePeriod'],
                  })
                }
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              >
                {NOTICE_PERIOD_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preferred Indian Cities */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Preferred Work Locations in India
            </label>
            <div className="flex flex-wrap gap-2">
              {INDIAN_CITIES.map((city) => {
                const isSelected = (profile.preferredLocations || []).includes(city);
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => toggleCityPreference(city)}
                    className={`text-xs font-medium px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                    }`}
                  >
                    <span className="mr-1.5">{isSelected ? '✓' : '+'}</span>
                    {city}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 2: Personal & Role Preferences */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              Candidate Profile & Experience
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Current Location
              </label>
              <input
                type="text"
                placeholder="e.g. Bengaluru, India"
                value={profile.currentLocation || ''}
                onChange={(e) => setProfile({ ...profile, currentLocation: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Total Years of Experience
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={profile.yearsOfExperience}
                onChange={(e) => setProfile({ ...profile, yearsOfExperience: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
          </div>

          {/* Target Titles */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Target Roles / Job Titles
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {profile.targetTitles.map((title) => (
                <span
                  key={title}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                >
                  <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{title}</span>
                  <button
                    type="button"
                    onClick={() => removeTargetTitle(title)}
                    className="hover:text-rose-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTargetTitle();
                  }
                }}
                placeholder="Add role (e.g. SDE 2, Senior Fullstack)"
                className="flex-1 px-3.5 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
              <button
                type="button"
                onClick={addTargetTitle}
                className="px-4 py-2 text-xs font-semibold bg-zinc-200 dark:bg-zinc-700 rounded-xl hover:bg-zinc-300 transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>

            {profile.suggestedRoles && profile.suggestedRoles.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI-Detected Relevant Roles from Resume (Click to Add):</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.suggestedRoles
                    .filter((r) => !profile.targetTitles.includes(r))
                    .map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setProfile({ ...profile, targetTitles: [...profile.targetTitles, r] });
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-lg border border-dashed border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors cursor-pointer"
                      >
                        + {r}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Skills */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Core Technical Skills
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="hover:text-rose-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Add skill or technology"
                className="flex-1 px-3.5 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-4 py-2 text-xs font-semibold bg-zinc-200 dark:bg-zinc-700 rounded-xl hover:bg-zinc-300 transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>

            {profile.suggestedTechnologies && profile.suggestedTechnologies.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI-Detected Skills & Tools from Resume (Click to Add):</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.suggestedTechnologies
                    .filter((t) => !(profile.skills || []).includes(t))
                    .map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setProfile({ ...profile, skills: [...(profile.skills || []), t] });
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-lg border border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        + {t}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Resume Markdown Text */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              Full Resume Markdown / Text
            </h2>
            <span className="text-xs text-zinc-400">Synced with AI evaluations</span>
          </div>
          <p className="text-xs text-zinc-500">
            This text is fed directly into Gemini to calculate match scores and generate interview talking points.
          </p>
          <textarea
            rows={14}
            value={profile.resumeText}
            onChange={(e) => setProfile({ ...profile, resumeText: e.target.value })}
            className="w-full text-xs sm:text-sm p-4 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : savedSuccess ? (
              <Check className="w-4 h-4 text-emerald-300" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{savedSuccess ? 'Profile Saved Successfully!' : 'Save Profile & Preferences'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
