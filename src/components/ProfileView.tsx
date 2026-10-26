'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types/job';
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
  DollarSign,
  Loader2,
} from 'lucide-react';

export default function ProfileView() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    fetch('/api/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProfile(data.profile);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
        <p className="text-xs text-zinc-400 mt-2">Loading candidate profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="bg-gradient-to-r from-purple-900/10 via-indigo-900/10 to-blue-900/10 dark:from-purple-950/40 dark:via-indigo-950/40 dark:to-blue-950/40 border border-purple-200/50 dark:border-purple-800/30 rounded-3xl p-6 sm:p-8 flex items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            AI Fit Intelligence Core
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Your Candidate Profile & Resume
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1 max-w-xl">
            This profile is automatically referenced by Gemini whenever you run match evaluations, skill-gap analysis, or generate personalized cover letters.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
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

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Info */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-5">
          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-500" />
            Basic Information & Search Criteria
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Email / Contact
              </label>
              <input
                type="email"
                value={profile.email || ''}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Years of Experience
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={profile.yearsOfExperience}
                onChange={(e) => setProfile({ ...profile, yearsOfExperience: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Target Min Salary
              </label>
              <input
                type="text"
                placeholder="$150,000"
                value={profile.minSalary || ''}
                onChange={(e) => setProfile({ ...profile, minSalary: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={profile.preferredRemote}
                  onChange={(e) => setProfile({ ...profile, preferredRemote: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span>Prefer 100% Remote Roles</span>
              </label>
            </div>
          </div>

          {/* Target Titles */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Target Job Titles
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {profile.targetTitles.map((title) => (
                <span
                  key={title}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                >
                  <Briefcase className="w-3 h-3 text-indigo-500" />
                  <span>{title}</span>
                  <button
                    type="button"
                    onClick={() => removeTargetTitle(title)}
                    className="hover:text-rose-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
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
                placeholder="Add role title (e.g. AI Platform Engineer)"
                className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
              <button
                type="button"
                onClick={addTargetTitle}
                className="px-3 py-1.5 text-xs font-semibold bg-zinc-200 dark:bg-zinc-700 rounded-xl hover:bg-zinc-300 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Core Technical Skills & Keywords
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="hover:text-rose-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
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
                placeholder="Add skill (e.g. Next.js, Python, PostgreSQL)"
                className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-3 py-1.5 text-xs font-semibold bg-zinc-200 dark:bg-zinc-700 rounded-xl hover:bg-zinc-300 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Resume Text */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-500" />
              Full Resume / Background (Markdown or Text)
            </h3>
            <span className="text-xs text-zinc-400">
              The AI parses this to match requirements
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Paste your latest work experience, impact metrics, project bullet points, and education.
          </p>
          <textarea
            rows={14}
            value={profile.resumeText}
            onChange={(e) => setProfile({ ...profile, resumeText: e.target.value })}
            placeholder="Paste your full resume text here..."
            className="w-full text-xs sm:text-sm p-4 bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </form>
    </div>
  );
}
