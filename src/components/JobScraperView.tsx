'use client';

import React, { useState } from 'react';
import { Job, UserProfile } from '@/types/job';
import { getAuthHeaders } from '@/lib/auth';
import {
  Search,
  Globe,
  Loader2,
  ExternalLink,
  Building2,
  MapPin,
  Clock,
  Briefcase,
  BookmarkPlus,
  Check,
  AlertCircle,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';

interface JobScraperViewProps {
  profile: UserProfile | null;
  onSelectJob: (job: Job) => void;
  onJobsImported: (jobs: Job[]) => void;
  savedJobIds: Set<string>;
}

const POPULAR_COMPANIES = [
  { name: 'Swiggy', query: 'Swiggy' },
  { name: 'Razorpay', query: 'Razorpay' },
  { name: 'CRED', query: 'CRED' },
  { name: 'BrowserStack', query: 'BrowserStack' },
  { name: 'Zepto', query: 'Zepto' },
  { name: 'Postman', query: 'Postman' },
  { name: 'Wipro', query: 'Wipro' },
  { name: 'TCS', query: 'TCS' },
  { name: 'Infosys', query: 'Infosys' },
  { name: 'Zomato', query: 'Zomato' },
  { name: 'PhonePe', query: 'PhonePe' },
  { name: 'Flipkart', query: 'Flipkart' },
];

export default function JobScraperView({
  profile,
  onSelectJob,
  onJobsImported,
  savedJobIds,
}: JobScraperViewProps) {
  const [queryInput, setQueryInput] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [scrapedJobs, setScrapedJobs] = useState<Job[]>([]);
  const [currentCompany, setCurrentCompany] = useState<string>('');
  const [sortByMatch, setSortByMatch] = useState(true);

  const handleScrape = async (targetQuery?: string) => {
    const q = (targetQuery || queryInput).trim();
    if (!q) return;

    setIsScraping(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/harvest/company-url', {
        method: 'POST',
        signal: AbortSignal.timeout(25000),
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ url: q }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to scrape open jobs from this company');
      }

      const receivedJobs: Job[] = data.jobs || [];
      setScrapedJobs(receivedJobs);
      setCurrentCompany(data.company || q);
      setStatusMsg({
        type: 'success',
        text: data.message || `Discovered ${receivedJobs.length} open positions from ${data.company || q}!`,
      });
      setQueryInput('');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.name === 'TimeoutError' || err.message.includes('timeout')
            ? 'Scraping timed out. Please retry or check the company name.'
            : err.message
          : 'Scraping failed';
      setStatusMsg({ type: 'error', text: msg });
    } finally {
      setIsScraping(false);
    }
  };

  const handleSaveToTracker = (job: Job) => {
    onJobsImported([job]);
  };

  const displayedJobs = [...scrapedJobs].sort((a, b) => {
    if (sortByMatch) {
      return (b.matchScore || 0) - (a.matchScore || 0);
    }
    return 0;
  });

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            🎯 Company Career Scraper
          </span>
          {profile?.targetTitles?.length ? (
            <span className="text-xs text-zinc-500 font-medium">
              Matching for: {profile.targetTitles.slice(0, 2).join(', ')}
            </span>
          ) : null}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Scrape Real Jobs by Company or URL
        </h1>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
          Search by company name (e.g. <span className="font-semibold text-zinc-900 dark:text-zinc-200">Swiggy</span>, <span className="font-semibold text-zinc-900 dark:text-zinc-200">Razorpay</span>, <span className="font-semibold text-zinc-900 dark:text-zinc-200">Wipro</span>) or paste their career portal URL. We extract actual open positions matched to your profile with percentage scores.
        </p>

        {/* Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleScrape();
          }}
          className="mt-6 flex flex-col sm:flex-row gap-2.5"
        >
          <div className="relative flex-1">
            <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Enter Company Name (e.g. Swiggy, Razorpay, Wipro) or Career URL..."
              disabled={isScraping}
              className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isScraping || !queryInput.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {isScraping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Scraping Portal...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Scrape Jobs</span>
              </>
            )}
          </button>
        </form>

        {/* Popular Quick Chips */}
        <div className="mt-4 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-zinc-500 mr-1">Quick Select:</span>
          {POPULAR_COMPANIES.map((co) => (
            <button
              key={co.name}
              type="button"
              disabled={isScraping}
              onClick={() => {
                setQueryInput(co.query);
                handleScrape(co.query);
              }}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer disabled:opacity-50"
            >
              {co.name}
            </button>
          ))}
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`mt-4 flex items-center gap-2 p-3.5 rounded-xl text-xs sm:text-sm ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}
      </div>

      {/* Results Section */}
      {scrapedJobs.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                {currentCompany} Open Positions
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold">
                {displayedJobs.length} roles found
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSortByMatch(!sortByMatch)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  sortByMatch
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                    : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{sortByMatch ? 'Sorted by Match %' : 'Default Order'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {displayedJobs.map((job) => {
              const isSaved = savedJobIds.has(job.id);
              const score = job.matchScore ?? 80;

              return (
                <div
                  key={job.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-2xl p-5 sm:p-6 shadow-xs transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="space-y-3 flex-1 min-w-0">
                    {/* Header line: Match % badge + Urgency */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          score >= 85
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : score >= 70
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                        }`}
                      >
                        {score}% Match
                      </span>

                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-zinc-400" />
                        {job.company}
                      </span>

                      {job.remoteType && job.remoteType !== 'unknown' && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 uppercase tracking-wider font-semibold text-[10px]">
                          {job.remoteType}
                        </span>
                      )}
                    </div>

                    {/* Job Title */}
                    <div>
                      <h3
                        onClick={() => onSelectJob(job)}
                        className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                      >
                        {job.title}
                      </h3>
                      {job.matchReason && (
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 shrink-0" />
                          <span>{job.matchReason}</span>
                        </p>
                      )}
                    </div>

                    {/* Meta info: Location, Experience, Posting Date, Salary if mentioned */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                        {job.location}
                      </span>

                      {job.experienceRequired && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                          {job.experienceRequired}
                        </span>
                      )}

                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        {job.postedAt
                          ? new Date(job.postedAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Recent'}
                      </span>

                      {/* Salary strictly if mentioned */}
                      {job.salary && job.salary !== 'Not Disclosed' && (
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {job.salary}
                        </span>
                      )}
                    </div>

                    {/* Description snippet */}
                    {job.description && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>
                    )}

                    {/* Technical requirements pills */}
                    {job.requirements && job.requirements.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {job.requirements.slice(0, 5).map((req, i) => (
                          <span
                            key={i}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium"
                          >
                            {req}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions column */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0">
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Apply on Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleSaveToTracker(job)}
                      disabled={isSaved}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-colors cursor-pointer ${
                        isSaved
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 cursor-default'
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Saved to Tracker</span>
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Save to Tracker</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
