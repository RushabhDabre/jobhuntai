'use client';

import React, { useState, useMemo } from 'react';
import { Job, JobStatus, UserProfile } from '@/types/job';
import { getSafeJobUrl } from '@/lib/jobLinks';
import { getAuthHeaders } from '@/lib/auth';
import {
  Sparkles,
  ExternalLink,
  Building2,
  MapPin,
  IndianRupee,
  Clock,
  ArrowRight,
  Trash2,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  UploadCloud,
  Search,
  Globe,
  Loader2,
  AlertCircle,
  Zap,
} from 'lucide-react';

interface SmartFeedViewProps {
  jobs: Job[];
  profile: UserProfile | null;
  onSelectJob: (job: Job) => void;
  onUpdateStatus: (jobId: string, newStatus: JobStatus) => void;
  onDeleteJob: (jobId: string) => void;
  onOpenQuickSetup: () => void;
  onHarvestMatching?: () => void;
  onJobsImported?: (jobs: Job[]) => void;
}

type FreshnessOption = '48h' | '7d' | '10d' | '30d' | 'all';

const STATUS_OPTIONS: { id: JobStatus; label: string }[] = [
  { id: 'discovered', label: 'Discovered' },
  { id: 'saved', label: 'Saved' },
  { id: 'applied', label: 'Applied' },
  { id: 'interviewing', label: 'Interviewing' },
  { id: 'offer', label: 'Offer' },
  { id: 'rejected', label: 'Archived' },
];

const POPULAR_COMPANIES = [
  { name: 'Swiggy', url: 'https://jobs.lever.co/swiggy' },
  { name: 'Razorpay', url: 'https://boards.greenhouse.io/razorpay' },
  { name: 'CRED', url: 'https://boards.greenhouse.io/cred' },
  { name: 'BrowserStack', url: 'https://jobs.ashbyhq.com/browserstack' },
  { name: 'Zepto', url: 'https://jobs.lever.co/zepto' },
  { name: 'Postman', url: 'https://boards.greenhouse.io/postman' },
];

export default function SmartFeedView({
  jobs,
  profile,
  onSelectJob,
  onUpdateStatus,
  onDeleteJob,
  onOpenQuickSetup,
  onJobsImported,
}: SmartFeedViewProps) {
  // Scraper & Search Hub State
  const [activeScrapeMode, setActiveScrapeMode] = useState<'company' | 'platforms'>('company');
  const [companyUrlInput, setCompanyUrlInput] = useState('');
  const [isScrapingCompany, setIsScrapingCompany] = useState(false);
  const [companyScrapeMsg, setCompanyScrapeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [platformQuery, setPlatformQuery] = useState(profile?.targetTitles?.[0] || '');
  const [platformLoc, setPlatformLoc] = useState(profile?.preferredLocations?.[0] || 'Bengaluru');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'linkedin' | 'naukri' | 'indeed' | 'google-jobs'>('all');
  const [immediateJoinerBoost, setImmediateJoinerBoost] = useState(true);
  const [isSearchingPlatforms, setIsSearchingPlatforms] = useState(false);
  const [platformSearchMsg, setPlatformSearchMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Freshness & Facet filters
  const [freshness, setFreshness] = useState<FreshnessOption>('48h');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedTech, setSelectedTech] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [immediateOnlyFilter, setImmediateOnlyFilter] = useState(false);

  // Handle Company Career URL Scraping
  const handleScrapeCompany = async (urlToScrape?: string) => {
    const targetUrl = (urlToScrape || companyUrlInput).trim();
    if (!targetUrl) return;

    setIsScrapingCompany(true);
    setCompanyScrapeMsg(null);

    try {
      const res = await fetch('/api/harvest/company-url', {
        method: 'POST',
        signal: AbortSignal.timeout(25000),
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to scrape company website');
      }

      if (data.jobs && data.jobs.length > 0 && onJobsImported) {
        onJobsImported(data.jobs);
      }

      setCompanyScrapeMsg({
        type: 'success',
        text: data.message || `Discovered ${data.jobs?.length || 0} open positions with match percentages!`,
      });
      setCompanyUrlInput('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? (err.name === 'TimeoutError' || err.message.includes('timeout') ? 'Company portal scraping timed out. Please retry or check the URL.' : err.message) : 'Scraping failed';
      setCompanyScrapeMsg({ type: 'error', text: msg });
    } finally {
      setIsScrapingCompany(false);
    }
  };

  // Handle Cross-Platform Search (LinkedIn, Naukri, Indeed, Google Jobs)
  const handlePlatformSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = platformQuery.trim() || profile?.targetTitles?.[0] || 'Software Engineer';
    setIsSearchingPlatforms(true);
    setPlatformSearchMsg(null);

    try {
      const res = await fetch('/api/jobs/search-platforms', {
        method: 'POST',
        signal: AbortSignal.timeout(25000),
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          query,
          location: platformLoc.trim() || 'India',
          platform: selectedPlatform,
          immediateOnly: immediateJoinerBoost,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Platform search failed');
      }

      if (data.jobs && data.jobs.length > 0 && onJobsImported) {
        onJobsImported(data.jobs);
      }

      setPlatformSearchMsg({
        type: 'success',
        text: data.message || `Found ${data.jobs?.length || 0} matching roles!`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Search failed';
      setPlatformSearchMsg({ type: 'error', text: msg });
    } finally {
      setIsSearchingPlatforms(false);
    }
  };

  // Calculate age of each job in hours
  const getJobAgeHours = (postedAtStr: string) => {
    const postedTime = new Date(postedAtStr).getTime();
    const now = Date.now();
    return Math.max(0, (now - postedTime) / (1000 * 60 * 60));
  };

  const formatAgeText = (postedAtStr: string) => {
    const hoursAgo = getJobAgeHours(postedAtStr);
    if (hoursAgo < 1) return 'Just now';
    if (hoursAgo < 24) return `${Math.round(hoursAgo)} hrs ago`;
    const daysAgo = Math.floor(hoursAgo / 24);
    if (daysAgo === 1) return '1 day ago';
    return `${daysAgo} days ago`;
  };

  // Filter jobs based on freshness, immediate joiner, role, tech, location, query
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const ageHours = getJobAgeHours(job.postedAt || job.createdAt);

      // Freshness filter
      if (freshness === '48h' && ageHours > 48) return false;
      if (freshness === '7d' && ageHours > 7 * 24) return false;
      if (freshness === '10d' && ageHours > 10 * 24) return false;
      if (freshness === '30d' && ageHours > 30 * 24) return false;

      // Immediate Joiner Filter
      if (immediateOnlyFilter && !job.isUrgentHiring && (job.matchScore || 0) < 80) {
        return false;
      }

      // Role filter
      if (selectedRole !== 'all') {
        const titleLower = job.title.toLowerCase();
        const categoryLower = (job.roleCategory || '').toLowerCase();
        const roleLower = selectedRole.toLowerCase();
        if (!titleLower.includes(roleLower) && !categoryLower.includes(roleLower)) {
          return false;
        }
      }

      // Tech filter
      if (selectedTech !== 'all') {
        const techLower = selectedTech.toLowerCase();
        const techMatch = (job.technologies || []).some((t) => t.toLowerCase() === techLower);
        const descMatch = (job.description || '').toLowerCase().includes(techLower);
        const titleMatch = job.title.toLowerCase().includes(techLower);
        if (!techMatch && !descMatch && !titleMatch) {
          return false;
        }
      }

      // Location filter
      if (selectedLocation !== 'all') {
        const locLower = selectedLocation.toLowerCase();
        const jobLoc = (job.location || '').toLowerCase();
        const jobCity = (job.city || '').toLowerCase();
        if (!jobLoc.includes(locLower) && !jobCity.includes(locLower)) {
          return false;
        }
      }

      // Free Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = job.title.toLowerCase().includes(q);
        const inCompany = job.company.toLowerCase().includes(q);
        const inLoc = job.location.toLowerCase().includes(q);
        if (!inTitle && !inCompany && !inLoc) return false;
      }

      return true;
    });
  }, [jobs, freshness, immediateOnlyFilter, selectedRole, selectedTech, selectedLocation, searchQuery]);

  // Counts for Freshness buttons
  const count48h = useMemo(() => jobs.filter((j) => getJobAgeHours(j.postedAt || j.createdAt) <= 48).length, [jobs]);
  const count7d = useMemo(() => jobs.filter((j) => getJobAgeHours(j.postedAt || j.createdAt) <= 7 * 24).length, [jobs]);
  const count10d = useMemo(() => jobs.filter((j) => getJobAgeHours(j.postedAt || j.createdAt) <= 10 * 24).length, [jobs]);
  const countImmediate = useMemo(() => jobs.filter((j) => j.isUrgentHiring || (j.matchScore || 0) >= 80).length, [jobs]);

  const hasResume = Boolean(profile?.resumeText || profile?.resumeFileName);
  const isImmediateCandidate = profile?.noticePeriod === 'Immediate Joiner' || profile?.noticePeriod === '15 Days';

  // Distinct roles
  const dynamicRoles = useMemo(() => {
    const set = new Set<string>();
    if (profile?.targetTitles) {
      profile.targetTitles.forEach((t) => t && set.add(t));
    }
    if (profile?.suggestedRoles) {
      profile.suggestedRoles.forEach((r) => r && set.add(r));
    }
    jobs.forEach((j) => {
      if (j.roleCategory) set.add(j.roleCategory);
      if (j.title) set.add(j.title);
    });
    return Array.from(set);
  }, [profile, jobs]);

  // Distinct technologies
  const dynamicTechnologies = useMemo(() => {
    const set = new Set<string>();
    if (profile?.preferredTechnologies) {
      profile.preferredTechnologies.forEach((t) => t && set.add(t));
    }
    if (profile?.suggestedTechnologies) {
      profile.suggestedTechnologies.forEach((t) => t && set.add(t));
    }
    if (profile?.skills) {
      profile.skills.forEach((s) => s && set.add(s));
    }
    jobs.forEach((j) => {
      if (Array.isArray(j.technologies)) {
        j.technologies.forEach((t) => t && set.add(t));
      }
    });
    return Array.from(set);
  }, [profile, jobs]);

  // Distinct locations
  const dynamicLocations = useMemo(() => {
    const set = new Set<string>();
    if (profile?.preferredLocations) {
      profile.preferredLocations.forEach((l) => l && set.add(l));
    }
    jobs.forEach((j) => {
      if (j.city) set.add(j.city);
      else if (j.location) set.add(j.location);
    });
    return Array.from(set);
  }, [profile, jobs]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Immediate Notice Fast-Track Banner */}
      {isImmediateCandidate && (
        <div className="p-4 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white dark:from-emerald-950/40 dark:via-zinc-900 dark:to-zinc-900 flex items-start gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold text-sm">
            ⚡
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                Immediate Joiner Fast-Track Active
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                Notice: {profile?.noticePeriod || 'Immediate (< 20 Days)'}
              </span>
            </div>
            <p className="text-xs text-emerald-800 dark:text-emerald-300/90 mt-0.5">
              Companies actively prefer candidates who can join within 15-20 days. Your AI match pitches will automatically highlight your immediate availability to jump to the top of recruiter inboxes.
            </p>
          </div>
        </div>
      )}

      {/* WEB SCRAPER & JOB SEARCH HUB */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        {/* Hub Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-500" />
              <span>Job Discovery & Web Scraper Engine</span>
            </h2>
            <p className="text-xs text-zinc-500">
              Scrape relevant jobs from any company website or search live across LinkedIn, Naukri, and Indeed
            </p>
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveScrapeMode('company')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeScrapeMode === 'company'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span>Paste Company Link</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveScrapeMode('platforms')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeScrapeMode === 'platforms'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Search All Job Platforms</span>
            </button>
          </div>
        </div>

        {/* MODE 1: Paste Any Company Career Link */}
        {activeScrapeMode === 'company' && (
          <div className="space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleScrapeCompany();
              }}
              className="space-y-3"
            >
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Paste Company Website or Career Page URL
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="url"
                    placeholder="e.g. https://careers.swiggy.com or boards.greenhouse.io/razorpay"
                    value={companyUrlInput}
                    onChange={(e) => {
                      setCompanyUrlInput(e.target.value);
                      setCompanyScrapeMsg(null);
                    }}
                    className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isScrapingCompany || !companyUrlInput.trim()}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  {isScrapingCompany ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Scraping Website...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Scrape Company Jobs</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status Message */}
              {companyScrapeMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    companyScrapeMsg.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {companyScrapeMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{companyScrapeMsg.text}</span>
                </div>
              )}
            </form>

            {/* Quick Presets */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-[11px] font-semibold text-zinc-500 mr-2">Quick 1-Click Company Scrape:</span>
              <div className="inline-flex flex-wrap gap-1.5 mt-1 sm:mt-0">
                {POPULAR_COMPANIES.map((comp) => (
                  <button
                    key={comp.name}
                    type="button"
                    onClick={() => {
                      setCompanyUrlInput(comp.url);
                      handleScrapeCompany(comp.url);
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-600 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                  >
                    + {comp.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: Search Across All Job Platforms */}
        {activeScrapeMode === 'platforms' && (
          <form onSubmit={handlePlatformSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Job Role / Skill Keyword
                </label>
                <input
                  type="text"
                  placeholder="e.g. DevOps Engineer, SAP ABAP, React"
                  value={platformQuery}
                  onChange={(e) => setPlatformQuery(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Target Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pune, Bengaluru, Remote"
                  value={platformLoc}
                  onChange={(e) => setPlatformLoc(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Platform
                </label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value as 'all' | 'linkedin' | 'naukri' | 'indeed' | 'google-jobs')}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100"
                >
                  <option value="all">All Platforms (LinkedIn + Naukri + Indeed)</option>
                  <option value="linkedin">LinkedIn Jobs</option>
                  <option value="indeed">Indeed India</option>
                  <option value="google-jobs">Google Jobs</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={immediateJoinerBoost}
                  onChange={(e) => setImmediateJoinerBoost(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                  <Zap className="w-3.5 h-3.5" /> Boost Roles Prioritizing Immediate Joiners (&lt; 20 Days)
                </span>
              </label>

              <button
                type="submit"
                disabled={isSearchingPlatforms || !platformQuery.trim()}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
              >
                {isSearchingPlatforms ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching Platforms...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search Across Platforms</span>
                  </>
                )}
              </button>
            </div>

            {platformSearchMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  platformSearchMsg.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {platformSearchMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{platformSearchMsg.text}</span>
              </div>
            )}
          </form>
        )}
      </div>

      {/* FILTER CONTROL BAR */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* ROW 1: Freshness Filter (FIRST FILTER: 48 HOURS) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <span>Vacancy Recency & Urgent Filter</span>
            </span>
            <span className="text-xs text-zinc-400">
              Showing <strong>{filteredJobs.length}</strong> matching roles
            </span>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <button
              onClick={() => setFreshness('48h')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                freshness === '48h'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold'
                  : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>⚡ Last 48 Hours ({count48h})</span>
            </button>

            <button
              onClick={() => setFreshness('7d')}
              className={`px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                freshness === '7d'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold'
                  : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
              }`}
            >
              Last 7 Days ({count7d})
            </button>

            <button
              onClick={() => setFreshness('all')}
              className={`px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                freshness === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold'
                  : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
              }`}
            >
              All Openings ({jobs.length})
            </button>

            {/* Immediate Joiner Toggle Pill */}
            <button
              onClick={() => setImmediateOnlyFilter(!immediateOnlyFilter)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                immediateOnlyFilter
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs font-bold'
                  : 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:border-amber-400'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>⚡ Immediate Joiners Priority ({countImmediate})</span>
            </button>
          </div>
        </div>

        {/* ROW 2: Filter by Role, Tech, Location */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Role Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Role Filter
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100"
            >
              <option value="all">
                {dynamicRoles.length === 0 ? 'All Roles' : 'All Roles'}
              </option>
              {dynamicRoles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {/* Technology Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Technology Filter
            </label>
            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="w-full text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100"
            >
              <option value="all">
                {dynamicTechnologies.length === 0 ? 'All Technologies' : 'All Technologies'}
              </option>
              {dynamicTechnologies.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Location Filter
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100"
            >
              <option value="all">
                {dynamicLocations.length === 0 ? 'All Locations' : 'All Locations'}
              </option>
              {dynamicLocations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ROW 3: Keyword Search */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by title, company, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <button
            onClick={onOpenQuickSetup}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* JOB CARDS LIST */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              No matching vacancies found for current filter
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Paste a company career URL above, search across platforms, or expand your filter to &quot;All Openings&quot;.
            </p>
            {freshness !== 'all' && (
              <button
                onClick={() => setFreshness('all')}
                className="mt-2 text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
              >
                View All Openings ({jobs.length})
              </button>
            )}
          </div>
        ) : (
          filteredJobs.map((job) => {
            const ageHours = getJobAgeHours(job.postedAt || job.createdAt);
            const isWithin48h = ageHours <= 48;

            return (
              <div
                key={job.id}
                onClick={() => onSelectJob(job)}
                className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-start justify-between gap-5"
              >
                {/* Left Column: Job Info */}
                <div className="space-y-3 flex-1">
                  {/* Badges: Freshness, Match %, Urgent Hiring */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Relevance Score in % */}
                    {job.matchScore !== undefined && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 rounded-full">
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        {job.matchScore}% Match
                      </span>
                    )}

                    {/* Urgent / Immediate Joiner Badge */}
                    {(job.isUrgentHiring || isImmediateCandidate) && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        <Zap className="w-3 h-3 text-amber-500" />
                        Immediate Joiner Priority
                      </span>
                    )}

                    {/* Freshness Badge */}
                    {isWithin48h ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <Flame className="w-3.5 h-3.5 text-emerald-500" />
                        ⚡ {formatAgeText(job.postedAt || job.createdAt)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        {formatAgeText(job.postedAt || job.createdAt)}
                      </span>
                    )}

                    <span className="text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {job.source}
                    </span>
                  </div>

                  {/* Role Title */}
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {job.title}
                  </h3>

                  {/* Company & Location & CTC */}
                  <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                      {job.company}
                    </span>

                    <span className="text-zinc-300 dark:text-zinc-700">•</span>

                    <span className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-300 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                      {job.location}
                    </span>

                    {(job.salaryInLpa || job.salary) && (
                      <>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold">
                          <IndianRupee className="w-3.5 h-3.5" />
                          {job.salaryInLpa || job.salary}
                        </span>
                      </>
                    )}

                    {job.experienceRequired && (
                      <>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span className="text-zinc-500">Exp: {job.experienceRequired}</span>
                      </>
                    )}
                  </div>

                  {/* Technologies tags */}
                  {job.technologies && job.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {job.technologies.map((t) => (
                        <span
                          key={t}
                          className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Match Reason Breakdown */}
                  {(job.matchReason || job.matchAnalysis?.summary) && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">Semantic Match: </strong>
                      {job.matchReason || job.matchAnalysis?.summary}
                    </p>
                  )}
                </div>

                {/* Right Column: Actions */}
                <div
                  className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Status Dropdown */}
                  <select
                    value={job.status}
                    onChange={(e) => onUpdateStatus(job.id, e.target.value as JobStatus)}
                    className="text-xs font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2">
                    <a
                      href={getSafeJobUrl(job)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                    >
                      <span>Apply</span>
                      <ExternalLink className="w-3 h-3 text-zinc-400" />
                    </a>

                    <button
                      onClick={() => onSelectJob(job)}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Pitch & Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => onDeleteJob(job.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
