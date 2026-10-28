'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Plus,
  Compass,
  FileText,
} from 'lucide-react';
import { UserProfile } from '@/types/job';
import { getAuthHeaders, getStoredSession } from '@/lib/auth';

interface QuickStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onSaveProfile: (updated: Partial<UserProfile>) => void;
  onTriggerSearch: () => void;
}

const POPULAR_LOCATIONS = [
  'Pune',
  'Mumbai',
  'Hyderabad',
  'Bengaluru',
  'Delhi NCR',
  'Chennai',
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
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [customTechInput, setCustomTechInput] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeUploadedName, setResumeUploadedName] = useState('');
  const [detectedDomain, setDetectedDomain] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Derive dynamic suggestions from the resume
  const availableRoles = useMemo(() => {
    const list: string[] = [];
    if (profile?.suggestedRoles && profile.suggestedRoles.length > 0) {
      list.push(...profile.suggestedRoles);
    }
    if (profile?.targetTitles) {
      for (const t of profile.targetTitles) {
        if (!list.includes(t)) list.push(t);
      }
    }
    // Add any currently selected roles
    for (const r of selectedRoles) {
      if (!list.includes(r)) list.push(r);
    }
    return list;
  }, [profile, selectedRoles]);

  const availableTechs = useMemo(() => {
    const list: string[] = [];
    if (profile?.suggestedTechnologies && profile.suggestedTechnologies.length > 0) {
      list.push(...profile.suggestedTechnologies);
    }
    if (profile?.skills) {
      for (const s of profile.skills.slice(0, 15)) {
        if (!list.includes(s)) list.push(s);
      }
    }
    if (profile?.preferredTechnologies) {
      for (const p of profile.preferredTechnologies) {
        if (!list.includes(p)) list.push(p);
      }
    }
    for (const t of selectedTechs) {
      if (!list.includes(t)) list.push(t);
    }
    return list;
  }, [profile, selectedTechs]);

  useEffect(() => {
    if (profile) {
      setSelectedRoles(profile.targetTitles || []);
      setSelectedTechs(profile.preferredTechnologies || []);
      setSelectedLocations(profile.preferredLocations || []);
      if (profile.resumeFileName) {
        setResumeUploadedName(profile.resumeFileName);
      }
      if (profile.domainCategory) {
        setDetectedDomain(profile.domainCategory);
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

  const addCustomRole = () => {
    const trimmed = customRoleInput.trim();
    if (trimmed && !selectedRoles.includes(trimmed)) {
      setSelectedRoles([...selectedRoles, trimmed]);
      setCustomRoleInput('');
    }
  };

  const addCustomTech = () => {
    const trimmed = customTechInput.trim();
    if (trimmed && !selectedTechs.includes(trimmed)) {
      setSelectedTechs([...selectedTechs, trimmed]);
      setCustomTechInput('');
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploadingResume(true);
    setUploadError(null);

    const session = getStoredSession();
    const userId = session?.id || profile?.userId || profile?.id;

    const formData = new FormData();
    formData.append('file', file);
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
        throw new Error(data.error || 'Failed to parse resume');
      }

      setResumeUploadedName(file.name);
      if (data.profile?.domainCategory) {
        setDetectedDomain(data.profile.domainCategory);
      }

      // Automatically select the AI extracted titles and technologies
      if (Array.isArray(data.profile?.targetTitles) && data.profile.targetTitles.length > 0) {
        setSelectedRoles(data.profile.targetTitles);
      }
      if (Array.isArray(data.profile?.preferredTechnologies) && data.profile.preferredTechnologies.length > 0) {
        setSelectedTechs(data.profile.preferredTechnologies);
      }

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
      targetTitles: selectedRoles,
      preferredTechnologies: selectedTechs,
      preferredLocations: selectedLocations,
      hasCompletedQuickSetup: true,
    });
    onTriggerSearch();
    onClose();
  };

  const hasResume = Boolean(resumeUploadedName || profile?.resumeText);

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
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
              <Compass className="w-3.5 h-3.5" />
              <span>Resume & Search Preferences</span>
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Customize Your Job Match Profile
            </h2>
            <p className="text-xs text-zinc-500">
              Upload your resume first. The AI will extract your exact profession (SAP, DevOps, Fullstack, QA, Mobile, etc.) and generate relevant vacancy criteria.
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
          {/* STEP 1: Upload Resume (Always First!) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span>1. Upload Resume (Generates Relevant Job Roles & Skills)</span>
              </label>
              {detectedDomain && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Domain: {detectedDomain}
                </span>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4.5 text-center cursor-pointer transition-all ${
                hasResume
                  ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-500'
                  : 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20 hover:border-indigo-500 hover:bg-indigo-50/50'
              } flex items-center justify-between gap-4`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  hasResume
                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400'
                    : 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400'
                }`}>
                  {uploadingResume ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : hasResume ? (
                    <FileCheck className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <UploadCloud className="w-5 h-5 text-indigo-500" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {uploadingResume
                      ? 'Analyzing resume with Gemini AI...'
                      : resumeUploadedName
                      ? `Active Resume: ${resumeUploadedName}`
                      : 'Upload Your Resume PDF (DevOps, SAP, Fullstack, QA, etc.)'}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {hasResume
                      ? 'Click to upload an updated version or switch files'
                      : 'AI reads your background and auto-suggests matching roles & tech stack'}
                  </p>
                </div>
              </div>

              <span className={`text-xs font-semibold px-3 py-1.5 rounded-xl border shadow-xs shrink-0 ${
                hasResume
                  ? 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                  : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
              }`}>
                {hasResume ? 'Change Resume' : 'Select PDF'}
              </span>
            </div>

            {uploadError && <p className="text-xs text-rose-500">{uploadError}</p>}
          </div>

          {/* STEP 2: Job Role Preferences (Populated dynamically from resume!) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200">
                <Briefcase className="w-4 h-4 text-indigo-500" />
                <span>2. Target Job Roles {availableRoles.length > 0 ? '(Relevant to Your Resume)' : ''}</span>
              </div>
              {hasResume && (
                <span className="text-[10px] text-zinc-400">Click to select/deselect</span>
              )}
            </div>

            {availableRoles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableRoles.map((role) => {
                  const isSelected = selectedRoles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleItem(selectedRoles, setSelectedRoles, role)}
                      className={`text-xs px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer font-medium ${
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
            ) : (
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-zinc-300 dark:border-zinc-700 text-xs text-zinc-500 text-center">
                <span>Upload your resume above to get automated job role suggestions tailored to your background.</span>
              </div>
            )}

            {/* Custom Role Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Or type a custom role (e.g. SAP ABAP Consultant, DevOps Lead) and press Add"
                value={customRoleInput}
                onChange={(e) => setCustomRoleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomRole();
                  }
                }}
                className="flex-1 text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={addCustomRole}
                className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Role</span>
              </button>
            </div>
          </div>

          {/* STEP 3: Technologies & Skills (Populated dynamically from resume!) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200">
                <Code2 className="w-4 h-4 text-emerald-500" />
                <span>3. Primary Technologies & Tools {availableTechs.length > 0 ? '(Extracted from Resume)' : ''}</span>
              </div>
              {hasResume && (
                <span className="text-[10px] text-zinc-400">Click to select/deselect</span>
              )}
            </div>

            {availableTechs.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableTechs.map((tech) => {
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
            ) : (
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-zinc-300 dark:border-zinc-700 text-xs text-zinc-500 text-center">
                <span>Upload your resume above to extract your exact tech stack and tools.</span>
              </div>
            )}

            {/* Custom Tech Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Or type a custom technology/skill (e.g. Kubernetes, SAP S/4HANA) and press Add"
                value={customTechInput}
                onChange={(e) => setCustomTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomTech();
                  }
                }}
                className="flex-1 text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={addCustomTech}
                className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Skill</span>
              </button>
            </div>
          </div>

          {/* STEP 4: Preferred Locations in India */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200">
              <MapPin className="w-4 h-4 text-purple-500" />
              <span>4. Preferred Locations (India Market)</span>
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

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer text-sm"
            >
              <span>Apply Filters & Discover 48h Vacancies</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-center text-[11px] text-zinc-400 mt-2">
              ⚡ Vacancies are refreshed and filtered according to your selected roles and technologies.
            </p>
          </div>
        </form>
      </div>
    </dialog>
  );
}
