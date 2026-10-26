'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  UploadCloud,
  FileCheck,
  Check,
  Loader2,
  X,
  MapPin,
  Briefcase,
  Code2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { UserProfile } from '@/types/job';

interface QuickStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onSaveProfile: (updated: Partial<UserProfile>) => void;
  onTriggerSearch: () => void;
}

const POPULAR_ROLES = [
  'Software Developer',
  'Frontend Developer',
  'Fullstack Developer',
  'React Developer',
  'Backend Developer',
  'Java Developer',
  'Python Developer',
  'C# / .NET Developer',
];

const POPULAR_TECHS = [
  'React',
  'Java',
  'C#',
  '.NET',
  'Python',
  'Node.js',
  'JavaScript',
  'TypeScript',
  'SQL',
];

const POPULAR_LOCATIONS = [
  'Pune',
  'Mumbai',
  'Hyderabad',
  'Bengaluru',
  'Remote (India)',
];

export default function QuickStartModal({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onTriggerSearch,
}: QuickStartModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeUploadedName, setResumeUploadedName] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setSelectedRoles(profile.targetTitles || ['Software Developer', 'Frontend Developer', 'React Developer']);
      setSelectedTechs(profile.preferredTechnologies || ['React', 'JavaScript', 'Python']);
      setSelectedLocations(profile.preferredLocations || ['Pune', 'Mumbai', 'Hyderabad']);
      if (profile.resumeFileName) {
        setResumeUploadedName(profile.resumeFileName);
      }
    }
  }, [profile]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploadingResume(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/profile/upload-resume', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to parse resume');
      }

      setResumeUploadedName(file.name);
      onSaveProfile(data.profile);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(msg);
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      targetTitles: selectedRoles.length > 0 ? selectedRoles : ['Software Developer'],
      preferredTechnologies: selectedTechs.length > 0 ? selectedTechs : ['React'],
      preferredLocations: selectedLocations.length > 0 ? selectedLocations : ['Pune'],
      hasCompletedQuickSetup: true,
    });
    onTriggerSearch();
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      className="m-auto backdrop:bg-black/60 backdrop:backdrop-blur-xs p-0 bg-transparent border-0 max-w-2xl w-full text-zinc-900 dark:text-zinc-100 open:animate-in open:fade-in open:zoom-in-95 duration-150"
      style={{ overscrollBehavior: 'contain' }}
    >
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" />
              ⚡ Vacancies Added in Last 48 Hours
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Search Real Job Vacancies
            </h2>
            <p className="text-xs text-zinc-500">
              Provide your resume, preferred roles, and locations. We&apos;ll match you with active openings right now.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          {/* Step 1: Resume Upload */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
              1. Your Resume (PDF, DOCX, or Text)
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-zinc-50/50 dark:bg-zinc-800/30 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  {uploadingResume ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : resumeUploadedName ? (
                    <FileCheck className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <UploadCloud className="w-5 h-5" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {uploadingResume
                      ? 'Parsing resume with Gemini AI...'
                      : resumeUploadedName
                      ? `Active: ${resumeUploadedName}`
                      : 'Upload Resume PDF / DOCX'}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    {resumeUploadedName
                      ? 'Click to change or re-upload'
                      : 'Gemini reads your tech stack & experience directly'}
                  </p>
                </div>
              </div>

              <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 shadow-xs">
                Browse File
              </span>
            </div>

            {uploadError && <p className="text-xs text-rose-500">{uploadError}</p>}
          </div>

          {/* Step 2: Job Preferences */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
              <Briefcase className="w-4 h-4 text-indigo-500" />
              <span>2. Job Role Preferences (Pick all that apply)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_ROLES.map((role) => {
                const isSelected = selectedRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleItem(selectedRoles, setSelectedRoles, role)}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-medium ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Technology */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
              <Code2 className="w-4 h-4 text-emerald-500" />
              <span>3. Primary Technologies (React, Java, C#, .NET, Python, etc.)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_TECHS.map((tech) => {
                const isSelected = selectedTechs.includes(tech);
                return (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => toggleItem(selectedTechs, setSelectedTechs, tech)}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-medium ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {tech}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Locations */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
              <MapPin className="w-4 h-4 text-purple-500" />
              <span>4. Preferred Locations</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_LOCATIONS.map((loc) => {
                const isSelected = selectedLocations.includes(loc);
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => toggleItem(selectedLocations, setSelectedLocations, loc)}
                    className={`text-xs px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer font-medium ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 font-semibold shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {loc}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer text-sm"
            >
              <span>Show Real Vacancies (Last 48 Hours)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-center text-[11px] text-zinc-400 mt-2">
              ⚡ Default filter is set to jobs added within 48 hrs. You can expand it to 10 days anytime.
            </p>
          </div>
        </form>
      </div>
    </dialog>
  );
}
