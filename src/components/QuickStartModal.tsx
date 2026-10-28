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
  ArrowRight,
  Plus,
  Compass,
  FileText,
  Key,
  ExternalLink,
  Eye,
  EyeOff,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { UserProfile } from '@/types/job';
import { getAuthHeaders, getStoredSession } from '@/lib/auth';

interface QuickStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onSaveProfile: (updated: Partial<UserProfile>) => Promise<void> | void;
  onTriggerSearch: (roles?: string[], locations?: string[]) => Promise<void> | void;
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

export const DOMAIN_PRESETS: Record<
  string,
  { label: string; roles: string[]; techs: string[] }
> = {
  devops: {
    label: '⚡ DevOps & Cloud',
    roles: [
      'DevOps Engineer',
      'Cloud Infrastructure Engineer',
      'Site Reliability Engineer (SRE)',
      'Kubernetes Specialist',
      'Platform Engineer',
      'DevOps Lead',
    ],
    techs: [
      'Kubernetes',
      'Docker',
      'Terraform',
      'AWS',
      'Jenkins',
      'Ansible',
      'CI/CD Pipelines',
      'Linux',
      'Prometheus',
      'Helm',
    ],
  },
  sap: {
    label: '💼 SAP ERP',
    roles: [
      'SAP ABAP Consultant',
      'SAP S/4HANA Developer',
      'SAP FICO Consultant',
      'SAP Technical Lead',
      'SAP MM/SD Consultant',
      'SAP HANA Architect',
    ],
    techs: [
      'SAP ABAP',
      'SAP S/4HANA',
      'SAP Fiori',
      'SAP HANA',
      'IDoc',
      'BAPI',
      'SAP BTP',
      'CDS Views',
      'OData Services',
      'ALV Reports',
    ],
  },
  fullstack: {
    label: '💻 Fullstack & Web',
    roles: [
      'Full Stack Developer',
      'Senior React Developer',
      'Node.js Backend Engineer',
      'Frontend Engineer',
      'Java Spring Boot Developer',
      'Software Engineer',
    ],
    techs: [
      'React',
      'Node.js',
      'TypeScript',
      'Next.js',
      'Java',
      'Spring Boot',
      'PostgreSQL',
      'Tailwind CSS',
      'MongoDB',
      'REST APIs',
    ],
  },
  qa: {
    label: '🧪 QA & Automation',
    roles: [
      'QA Automation Engineer',
      'SDET (Software Development Engineer in Test)',
      'Lead QA Engineer',
      'Performance Tester',
      'Automation Architect',
      'Manual QA Engineer',
    ],
    techs: [
      'Selenium',
      'Playwright',
      'Cypress',
      'Java',
      'Postman',
      'RestAssured',
      'JMeter',
      'TestNG',
      'Python',
      'CI/CD Integration',
    ],
  },
  data: {
    label: '🔬 Data & AI / ML',
    roles: [
      'Data Engineer',
      'Machine Learning Engineer',
      'Data Scientist',
      'AI Engineer',
      'BI Developer / Analyst',
      'Big Data Engineer',
    ],
    techs: [
      'Python',
      'SQL',
      'Apache Spark',
      'Databricks',
      'AWS Glue',
      'Airflow',
      'TensorFlow',
      'Power BI',
      'Pandas',
      'Snowflake',
    ],
  },
  mobile: {
    label: '📱 Mobile Apps',
    roles: [
      'Mobile App Developer',
      'Flutter Developer',
      'React Native Engineer',
      'Android Developer',
      'iOS Developer',
      'Mobile Lead',
    ],
    techs: [
      'Flutter',
      'React Native',
      'Kotlin',
      'Swift',
      'Android SDK',
      'iOS SDK',
      'Dart',
      'Firebase',
      'State Management (Bloc/Redux)',
    ],
  },
};

export default function QuickStartModal({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onTriggerSearch,
}: QuickStartModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API Key State
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'groq' | 'openrouter'>('gemini');
  const [noticePeriod, setNoticePeriod] = useState<string>('Immediate Joiner');

  // Domain selection state (defaults to DevOps, auto-switches on resume parse or pill click)
  const [activeDomainKey, setActiveDomainKey] = useState<string>('devops');

  // Resume & Preferences State
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([
    'Pune',
    'Mumbai',
    'Hyderabad',
    'Bengaluru',
    'Delhi NCR',
    'Remote (India)',
  ]);
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [customTechInput, setCustomTechInput] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeUploadedName, setResumeUploadedName] = useState('');
  const [detectedDomain, setDetectedDomain] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [parsedSuggestions, setParsedSuggestions] = useState<{ roles: string[]; techs: string[] }>({
    roles: [],
    techs: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when profile opens or changes
  useEffect(() => {
    if (profile) {
      if (profile.geminiApiKey) {
        setApiKeyInput(profile.geminiApiKey);
        setSelectedProvider('gemini');
        setIsEditingKey(false);
      } else if (profile.groqApiKey) {
        setApiKeyInput(profile.groqApiKey);
        setSelectedProvider('groq');
        setIsEditingKey(false);
      } else if (profile.openRouterApiKey) {
        setApiKeyInput(profile.openRouterApiKey);
        setSelectedProvider('openrouter');
        setIsEditingKey(false);
      } else {
        setIsEditingKey(true);
      }

      if (profile.noticePeriod) {
        setNoticePeriod(profile.noticePeriod);
      }

      if (profile.targetTitles && profile.targetTitles.length > 0) {
        setSelectedRoles(profile.targetTitles);
      }
      if (profile.preferredTechnologies && profile.preferredTechnologies.length > 0) {
        setSelectedTechs(profile.preferredTechnologies);
      }
      if (profile.preferredLocations && profile.preferredLocations.length > 0) {
        setSelectedLocations(profile.preferredLocations);
      }
      if (profile.resumeFileName) {
        setResumeUploadedName(profile.resumeFileName);
      }
      if (profile.domainCategory) {
        setDetectedDomain(profile.domainCategory);
        // Map detected domain to preset key if matching
        const catLower = profile.domainCategory.toLowerCase();
        if (catLower.includes('sap')) setActiveDomainKey('sap');
        else if (catLower.includes('devops') || catLower.includes('cloud') || catLower.includes('sre')) setActiveDomainKey('devops');
        else if (catLower.includes('qa') || catLower.includes('testing')) setActiveDomainKey('qa');
        else if (catLower.includes('data') || catLower.includes('ai') || catLower.includes('ml')) setActiveDomainKey('data');
        else if (catLower.includes('mobile')) setActiveDomainKey('mobile');
        else if (catLower.includes('fullstack') || catLower.includes('web')) setActiveDomainKey('fullstack');
      }
      if (profile.suggestedRoles || profile.suggestedTechnologies) {
        setParsedSuggestions({
          roles: profile.suggestedRoles || [],
          techs: profile.suggestedTechnologies || [],
        });
      }
    }
  }, [profile]);

  // Manage modal open/close via native HTML5 dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Derive dynamic list of role suggestions from domain presets + resume parsing + profile
  const availableRoles = useMemo(() => {
    const list: string[] = [];

    // 1. AI parsed suggestions take highest priority
    if (parsedSuggestions.roles.length > 0) {
      list.push(...parsedSuggestions.roles);
    }

    // 2. Profile suggested roles
    if (profile?.suggestedRoles) {
      for (const r of profile.suggestedRoles) {
        if (!list.includes(r)) list.push(r);
      }
    }

    // 3. Current active domain preset roles
    const domainPreset = DOMAIN_PRESETS[activeDomainKey];
    if (domainPreset) {
      for (const r of domainPreset.roles) {
        if (!list.includes(r)) list.push(r);
      }
    }

    // 4. Candidate's already configured target titles
    if (profile?.targetTitles) {
      for (const t of profile.targetTitles) {
        if (!list.includes(t)) list.push(t);
      }
    }

    // 5. Currently selected custom roles
    for (const r of selectedRoles) {
      if (!list.includes(r)) list.push(r);
    }

    return list;
  }, [parsedSuggestions.roles, profile, activeDomainKey, selectedRoles]);

  // Derive dynamic list of tech suggestions from domain presets + resume parsing + profile
  const availableTechs = useMemo(() => {
    const list: string[] = [];

    // 1. AI parsed technologies
    if (parsedSuggestions.techs.length > 0) {
      list.push(...parsedSuggestions.techs);
    }

    // 2. Profile suggested technologies
    if (profile?.suggestedTechnologies) {
      for (const t of profile.suggestedTechnologies) {
        if (!list.includes(t)) list.push(t);
      }
    }

    // 3. Current active domain preset technologies
    const domainPreset = DOMAIN_PRESETS[activeDomainKey];
    if (domainPreset) {
      for (const t of domainPreset.techs) {
        if (!list.includes(t)) list.push(t);
      }
    }

    // 4. Profile skills
    if (profile?.skills) {
      for (const s of profile.skills.slice(0, 15)) {
        if (!list.includes(s)) list.push(s);
      }
    }

    // 5. Currently selected custom techs
    for (const t of selectedTechs) {
      if (!list.includes(t)) list.push(t);
    }

    return list;
  }, [parsedSuggestions.techs, profile, activeDomainKey, selectedTechs]);

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

  const handleDomainSelect = (domainKey: string) => {
    setActiveDomainKey(domainKey);
    const preset = DOMAIN_PRESETS[domainKey];
    if (preset) {
      // Auto-select first 2 roles from this domain if none selected yet
      if (selectedRoles.length === 0) {
        setSelectedRoles(preset.roles.slice(0, 2));
      }
      if (selectedTechs.length === 0) {
        setSelectedTechs(preset.techs.slice(0, 5));
      }
    }
  };

  // Upload resume with isolated Gemini API key
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const activeKey = apiKeyInput.trim() || profile?.geminiApiKey;
    if (!activeKey) {
      setUploadError('Please enter your Google Gemini API key in Step 1 first so AI can parse your resume.');
      return;
    }

    setUploadingResume(true);
    setUploadError(null);

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
        signal: AbortSignal.timeout(25000),
        headers,
        body: formData,
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to parse resume');
      }

      setResumeUploadedName(file.name);
      setIsEditingKey(false);

      if (data.domainCategory) {
        setDetectedDomain(data.domainCategory);
        const catLower = data.domainCategory.toLowerCase();
        if (catLower.includes('sap')) setActiveDomainKey('sap');
        else if (catLower.includes('devops') || catLower.includes('cloud') || catLower.includes('sre')) setActiveDomainKey('devops');
        else if (catLower.includes('qa') || catLower.includes('testing')) setActiveDomainKey('qa');
        else if (catLower.includes('data') || catLower.includes('ai') || catLower.includes('ml')) setActiveDomainKey('data');
        else if (catLower.includes('mobile')) setActiveDomainKey('mobile');
        else if (catLower.includes('fullstack') || catLower.includes('web')) setActiveDomainKey('fullstack');
      }

      // Collect returned suggestion arrays
      const returnedRoles: string[] = Array.isArray(data.suggestedRoles) && data.suggestedRoles.length > 0
        ? data.suggestedRoles
        : Array.isArray(data.profile?.suggestedRoles)
        ? data.profile.suggestedRoles
        : [];

      const returnedTechs: string[] = Array.isArray(data.suggestedTechnologies) && data.suggestedTechnologies.length > 0
        ? data.suggestedTechnologies
        : Array.isArray(data.profile?.suggestedTechnologies)
        ? data.profile.suggestedTechnologies
        : [];

      setParsedSuggestions({
        roles: returnedRoles,
        techs: returnedTechs,
      });

      // Automatically select extracted titles and technologies
      if (Array.isArray(data.profile?.targetTitles) && data.profile.targetTitles.length > 0) {
        setSelectedRoles(data.profile.targetTitles);
      } else if (returnedRoles.length > 0) {
        setSelectedRoles(returnedRoles.slice(0, 3));
      }

      if (Array.isArray(data.profile?.preferredTechnologies) && data.profile.preferredTechnologies.length > 0) {
        setSelectedTechs(data.profile.preferredTechnologies);
      } else if (returnedTechs.length > 0) {
        setSelectedTechs(returnedTechs.slice(0, 6));
      }

      if (data.profile) {
        await onSaveProfile(data.profile);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(msg);
    } finally {
      setUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Submit preferences and launch job matching
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeKey =
      apiKeyInput.trim() ||
      profile?.geminiApiKey ||
      profile?.groqApiKey ||
      profile?.openRouterApiKey;

    if (!activeKey) {
      setUploadError('Please enter a free AI key (Gemini, Groq, or OpenRouter) in Step 1 to power your job matches.');
      return;
    }

    if (selectedRoles.length === 0) {
      setUploadError('Please select or add at least one Target Job Role in Step 3.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updates: Partial<UserProfile> = {
        targetTitles: selectedRoles,
        preferredTechnologies: selectedTechs,
        preferredLocations: selectedLocations,
        noticePeriod: (noticePeriod || 'Immediate Joiner') as UserProfile['noticePeriod'],
        domainCategory: detectedDomain || DOMAIN_PRESETS[activeDomainKey]?.label.replace(/^[^\w]+/, '').trim(),
        hasCompletedQuickSetup: true,
      };

      if (selectedProvider === 'groq') {
        updates.groqApiKey = activeKey;
        updates.preferredAiProvider = 'groq';
      } else if (selectedProvider === 'openrouter') {
        updates.openRouterApiKey = activeKey;
        updates.preferredAiProvider = 'openrouter';
      } else {
        updates.geminiApiKey = activeKey;
        updates.preferredAiProvider = 'gemini';
      }

      await onSaveProfile(updates);

      await onTriggerSearch(selectedRoles, selectedLocations);
      onClose();
    } catch (err) {
      console.error('Failed to finalize preferences:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasResume = Boolean(resumeUploadedName || profile?.resumeText);
  const hasKey = Boolean(apiKeyInput.trim() || profile?.geminiApiKey || profile?.groqApiKey || profile?.openRouterApiKey);

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      className="m-auto backdrop:bg-black/70 backdrop:backdrop-blur-xs p-0 bg-transparent border-0 max-w-2xl w-full text-zinc-900 dark:text-zinc-100 open:animate-in open:fade-in open:zoom-in-95 duration-150"
      style={{ overscrollBehavior: 'contain' }}
    >
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
              <Compass className="w-3.5 h-3.5" />
              <span>Step-by-Step Onboarding Wizard</span>
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Setup Your AI Job Matching Engine
            </h2>
            <p className="text-xs text-zinc-500">
              Connect a free AI key, upload your resume or pick roles, and discover matching vacancies.
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
          {/* STEP 1: Connect Free AI Key */}
          <div className="space-y-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-500" />
                <span>1. Connect Your Free AI API Key</span>
              </label>

              <a
                href={
                  selectedProvider === 'groq'
                    ? 'https://console.groq.com/keys'
                    : selectedProvider === 'openrouter'
                    ? 'https://openrouter.ai/keys'
                    : 'https://aistudio.google.com/app/apikey'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <span>
                  {selectedProvider === 'groq'
                    ? 'Get Free Key at Groq Console'
                    : selectedProvider === 'openrouter'
                    ? 'Get Free Key at OpenRouter'
                    : 'Get Free Key at Google AI Studio'}
                </span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Provider Switcher */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedProvider('gemini');
                  setIsEditingKey(true);
                }}
                className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors cursor-pointer ${
                  selectedProvider === 'gemini'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                Google Gemini (Free)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedProvider('groq');
                  setIsEditingKey(true);
                }}
                className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors cursor-pointer ${
                  selectedProvider === 'groq'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                Groq Llama 3.3 (100% Free & Fast)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedProvider('openrouter');
                  setIsEditingKey(true);
                }}
                className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors cursor-pointer ${
                  selectedProvider === 'openrouter'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                OpenRouter (Free Tier)
              </button>
            </div>

            <p className="text-[11px] text-zinc-500">
              Powers AI resume parsing, match scoring, and customized pitch generation. Free keys require <strong>zero billing or credit card</strong> and take 30 seconds to generate.
            </p>

            {hasKey && !isEditingKey ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                      ✓ AI Key Connected ({selectedProvider.toUpperCase()})
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      Isolated exclusively to your private account.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingKey(true)}
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
                >
                  Change Key
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    placeholder={
                      selectedProvider === 'groq'
                        ? 'gsk_... (Paste free Groq key here)'
                        : selectedProvider === 'openrouter'
                        ? 'sk-or-v1-... (Paste OpenRouter key here)'
                        : 'AIzaSy... (Paste free Gemini key here)'
                    }
                    value={apiKeyInput}
                    onChange={(e) => {
                      setApiKeyInput(e.target.value);
                      setUploadError(null);
                    }}
                    className="w-full text-xs pl-9 pr-20 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-zinc-900 dark:text-zinc-100"
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
                <p className="text-[10px] text-zinc-400">
                  🔒 <strong>Privacy Guarantee:</strong> Stored strictly in your personal profile. Never used by or shared with any other account.
                </p>
              </div>
            )}
          </div>

          {/* STEP 2: Upload Resume */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span>2. Upload Resume (Auto-detects Domain & Skills)</span>
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
                      : 'Upload Resume PDF / DOCX (Optional: or pick domain presets below)'}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {hasResume
                      ? 'Click to upload an updated version or switch files'
                      : 'AI automatically extracts your exact domain (SAP, DevOps, QA, etc.) and suggests criteria'}
                  </p>
                </div>
              </div>

              <span className={`text-xs font-semibold px-3 py-1.5 rounded-xl border shadow-xs shrink-0 ${
                hasResume
                  ? 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                  : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
              }`}>
                {hasResume ? 'Change File' : 'Select PDF'}
              </span>
            </div>

            {uploadError && (
              <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900">
                {uploadError}
              </p>
            )}
          </div>

          {/* STEP 3: Domain Presets & Target Job Roles */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                  <Briefcase className="w-4 h-4 text-indigo-500" />
                  <span>3. Target Job Roles</span>
                </div>
                <span className="text-[10px] text-zinc-400">Click pills to select / deselect</span>
              </div>

              {/* Quick Domain Switcher */}
              <div className="p-2.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/50 space-y-1.5">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Specialization Category:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(DOMAIN_PRESETS).map(([key, item]) => {
                    const isActive = activeDomainKey === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleDomainSelect(key)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-indigo-400'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Role Pills */}
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

            {/* Custom Role Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Or type custom role (e.g. SAP ABAP Consultant, DevOps Lead) & press Add"
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

          {/* STEP 4: Technologies & Skills */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                <Code2 className="w-4 h-4 text-emerald-500" />
                <span>4. Primary Technologies & Tools</span>
              </div>
              <span className="text-[10px] text-zinc-400">Click pills to select / deselect</span>
            </div>

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

            {/* Custom Tech Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Or type custom technology (e.g. Kubernetes, SAP S/4HANA, Terraform) & press Add"
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

          {/* STEP 5: Preferred Locations in India */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
              <MapPin className="w-4 h-4 text-purple-500" />
              <span>5. Preferred Locations (India Market)</span>
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

          {/* STEP 6: Notice Period (Immediate Joiner Advantage) */}
          <div className="space-y-2.5 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                <span>⚡ 6. Current Notice Period (Recruiter Priority)</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
                High Response Booster
              </span>
            </div>

            <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
              Indian companies actively prioritize candidates who can join within 15-20 days.
            </p>

            <div className="flex flex-wrap gap-2">
              {[
                { id: 'Immediate Joiner', label: '⚡ Immediate Joiner (< 20 Days Left)' },
                { id: '15 Days', label: '15 Days Notice' },
                { id: '30 Days', label: '30 Days Notice' },
                { id: '60 Days', label: '60 Days Notice' },
                { id: '90 Days', label: '90 Days Notice' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setNoticePeriod(item.id)}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-medium ${
                    noticePeriod === item.id
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                  }`}
                >
                  {noticePeriod === item.id ? '✓ ' : ''}
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || uploadingResume}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Harvesting & Matching 48h Vacancies...</span>
                </>
              ) : (
                <>
                  <span>Save Preferences & Fetch Matching Jobs 🚀</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-zinc-400 mt-2">
              ⚡ Openings are fetched and matched strictly using your isolated profile criteria.
            </p>
          </div>
        </form>
      </div>
    </dialog>
  );
}
