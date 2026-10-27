'use client';

import React, { useState, useMemo } from 'react';
import { Job, JobStatus, UserProfile } from '@/types/job';
import { getSafeJobUrl } from '@/lib/jobLinks';
import {
  Sparkles,
  ExternalLink,
  Building2,
  MapPin,
  IndianRupee,
  Briefcase,
  Clock,
  ArrowRight,
  Trash2,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
} from 'lucide-react';

interface SmartFeedViewProps {
  jobs: Job[];
  profile: UserProfile | null;
  onSelectJob: (job: Job) => void;
  onUpdateStatus: (jobId: string, newStatus: JobStatus) => void;
  onDeleteJob: (jobId: string) => void;
  onOpenQuickSetup: () => void;
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

export default function SmartFeedView({
  jobs,
  profile,
  onSelectJob,
  onUpdateStatus,
  onDeleteJob,
  onOpenQuickSetup,
}: SmartFeedViewProps) {
  // Freshness filter: DEFAULT IS 48 HOURS!
  const [freshness, setFreshness] = useState<FreshnessOption>('48h');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedTech, setSelectedTech] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Filter jobs based on freshness, role, tech, location, query
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const ageHours = getJobAgeHours(job.postedAt || job.createdAt);

      // Freshness filter
      if (freshness === '48h' && ageHours > 48) return false;
      if (freshness === '7d' && ageHours > 7 * 24) return false;
      if (freshness === '10d' && ageHours > 10 * 24) return false;
      if (freshness === '30d' && ageHours > 30 * 24) return false;

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
  }, [jobs, freshness, selectedRole, selectedTech, selectedLocation, searchQuery]);

  // Counts for Freshness buttons
  const count48h = useMemo(() => jobs.filter((j) => getJobAgeHours(j.postedAt || j.createdAt) <= 48).length, [jobs]);
  const count7d = useMemo(() => jobs.filter((j) => getJobAgeHours(j.postedAt || j.createdAt) <= 7 * 24).length, [jobs]);
  const count10d = useMemo(() => jobs.filter((j) => getJobAgeHours(j.postedAt || j.createdAt) <= 10 * 24).length, [jobs]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Search Preferences Summary Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Active Job Search Criteria
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span className="text-xs text-zinc-500">
              {profile?.resumeFileName ? `Resume: ${profile.resumeFileName}` : 'Resume loaded'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-700 dark:text-zinc-300 font-medium">
            <span>
              🎯 Roles: <strong>{profile?.targetTitles?.slice(0, 3).join(', ') || 'Software / React Developer'}</strong>
            </span>
            <span>
              📍 Cities: <strong>{profile?.preferredLocations?.join(', ') || 'Pune, Mumbai, Hyderabad'}</strong>
            </span>
            <span>
              ⏳ Notice: <strong>{profile?.noticePeriod || '30 Days'}</strong>
            </span>
          </div>
        </div>

        <button
          onClick={onOpenQuickSetup}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer shrink-0"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Edit Preferences & Resume</span>
        </button>
      </div>

      {/* FILTER CONTROL BAR */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* ROW 1: Freshness Filter (FIRST FILTER: 48 HOURS) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <span>Filter by Vacancy Date (Default: Last 48 Hours)</span>
            </span>
            <span className="text-xs text-zinc-400">
              Showing <strong>{filteredJobs.length}</strong> matching vacancies
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
              onClick={() => setFreshness('10d')}
              className={`px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                freshness === '10d'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold'
                  : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
              }`}
            >
              Last 10 Days ({count10d})
            </button>

            <button
              onClick={() => setFreshness('30d')}
              className={`px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                freshness === '30d'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold'
                  : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
              }`}
            >
              Last 30 Days
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
          </div>
        </div>

        {/* ROW 2: Filter by Role, Tech, Location */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Role Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Role Preference
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2"
            >
              <option value="all">All Roles</option>
              <option value="Software Developer">Software Developer</option>
              <option value="Frontend Developer">Frontend Developer</option>
              <option value="Fullstack Developer">Fullstack Developer</option>
              <option value="React Developer">React Developer</option>
              <option value="Backend Developer">Backend Developer</option>
            </select>
          </div>

          {/* Technology Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Technology Stack
            </label>
            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="w-full text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2"
            >
              <option value="all">All Technologies</option>
              <option value="React">React</option>
              <option value="Java">Java</option>
              <option value="C#">C# / .NET</option>
              <option value="Python">Python</option>
              <option value="Node.js">Node.js</option>
              <option value="TypeScript">TypeScript</option>
              <option value="SQL">SQL</option>
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Location (City)
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2"
            >
              <option value="all">All Locations (Pune, Mumbai, Hyderabad...)</option>
              <option value="Pune">Pune</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Remote">Remote</option>
            </select>
          </div>
        </div>
      </div>

      {/* VACANCY CARDS LIST */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center">
            <Clock className="w-10 h-10 mx-auto text-zinc-400 mb-3" />
            <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
              No vacancies found in this time window
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
              You are currently filtering for <strong>{freshness === '48h' ? 'Last 48 Hours' : freshness}</strong>. Click &quot;Last 7 Days&quot; or &quot;All Openings&quot; above to see more active openings.
            </p>
            <button
              onClick={() => setFreshness('all')}
              className="mt-4 text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
            >
              View All Openings
            </button>
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
                  {/* Freshness Badge & Platform Tag */}
                  <div className="flex flex-wrap items-center gap-2">
                    {isWithin48h ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <Flame className="w-3.5 h-3.5 text-emerald-500" />
                        ⚡ Added {formatAgeText(job.postedAt || job.createdAt)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        Added {formatAgeText(job.postedAt || job.createdAt)}
                      </span>
                    )}

                    <span className="text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {job.source}
                    </span>

                    {job.matchScore !== undefined && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full">
                        <Sparkles className="w-3 h-3" />
                        {job.matchScore}% Match
                      </span>
                    )}
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

                  {/* AI Match snippet */}
                  {job.matchAnalysis && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      <strong className="text-indigo-600 dark:text-indigo-400">Match Reason: </strong>
                      {job.matchAnalysis.summary}
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
                      <span>AI Review</span>
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
