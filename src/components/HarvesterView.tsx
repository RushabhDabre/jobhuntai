'use client';

import React, { useState } from 'react';
import {
  Flame,
  Bot,
  Globe,
  FileText,
  Search,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Job } from '@/types/job';

interface HarvesterViewProps {
  onJobsImported: (jobs: Job[]) => void;
  openSettings: () => void;
}

export default function HarvesterView({ onJobsImported, openSettings }: HarvesterViewProps) {
  const [activeSource, setActiveSource] = useState<'firecrawl' | 'apify' | 'ats' | 'manual'>('firecrawl');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [autoScore, setAutoScore] = useState(true);

  // Firecrawl State
  const [firecrawlUrl, setFirecrawlUrl] = useState('');
  const [firecrawlMode, setFirecrawlMode] = useState<'scrape' | 'crawl'>('scrape');

  // Apify State
  const [apifyProvider, setApifyProvider] = useState<'google-jobs' | 'linkedin' | 'indeed' | 'custom'>('google-jobs');
  const [apifyQuery, setApifyQuery] = useState('Full Stack Engineer');
  const [apifyLocation, setApifyLocation] = useState('Remote');
  const [apifyMaxItems, setApifyMaxItems] = useState(5);
  const [apifyActorId, setApifyActorId] = useState('');

  // ATS State
  const [atsPlatform, setAtsPlatform] = useState<'greenhouse' | 'lever' | 'ashby'>('greenhouse');
  const [atsSlug, setAtsSlug] = useState('stripe');
  const [atsKeyword, setAtsKeyword] = useState('Engineer');

  // Manual State
  const [manualTitle, setManualTitle] = useState('');
  const [manualCompany, setManualCompany] = useState('');
  const [manualLocation, setManualLocation] = useState('Remote');
  const [manualUrl, setManualUrl] = useState('');
  const [manualDescription, setManualDescription] = useState('');

  // Run Firecrawl
  const handleFirecrawlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firecrawlUrl) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/harvest/firecrawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: firecrawlUrl,
          mode: firecrawlMode,
          autoScore,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Firecrawl failed');
      }

      if (data.mode === 'crawl') {
        setStatusMessage({
          type: 'success',
          text: `Found ${data.foundLinks?.length || 0} candidate job links. Check your terminal or console.`,
        });
      } else if (data.job) {
        onJobsImported([data.job]);
        setStatusMessage({
          type: 'success',
          text: `Successfully scraped and imported "${data.job.title}" at ${data.job.company}!`,
        });
        setFirecrawlUrl('');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Scraping failed';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  // Run Apify
  const handleApifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/harvest/apify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: apifyProvider,
          actorId: apifyProvider === 'custom' ? apifyActorId : undefined,
          queries: [apifyQuery],
          location: apifyLocation,
          maxItems: apifyMaxItems,
          autoScore,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Apify search failed');
      }

      if (data.jobs && data.jobs.length > 0) {
        onJobsImported(data.jobs);
        setStatusMessage({
          type: 'success',
          text: `Successfully fetched and imported ${data.jobs.length} jobs via Apify!`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'No jobs found matching your criteria. Try adjusting keywords.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Apify search failed';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  // Run ATS Board Scrape
  const handleAtsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!atsSlug) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/harvest/ats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: atsPlatform,
          companySlug: atsSlug,
          keywordFilter: atsKeyword,
          limit: 10,
          autoScore,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'ATS board fetch failed');
      }

      if (data.jobs && data.jobs.length > 0) {
        onJobsImported(data.jobs);
        setStatusMessage({
          type: 'success',
          text: `Directly imported ${data.jobs.length} openings from ${atsSlug}'s ${atsPlatform} board!`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `No open roles found matching keyword "${atsKeyword}" on ${atsSlug}'s board.`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ATS scrape failed';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  // Manual Job Submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualCompany) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: manualTitle,
          company: manualCompany,
          location: manualLocation,
          url: manualUrl,
          description: manualDescription,
          source: 'manual',
          status: 'discovered',
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save job');
      }

      onJobsImported([data.job]);
      setStatusMessage({
        type: 'success',
        text: `Successfully added "${manualTitle}" at ${manualCompany}!`,
      });
      setManualTitle('');
      setManualCompany('');
      setManualUrl('');
      setManualDescription('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save job';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-indigo-900/10 via-violet-900/10 to-amber-900/10 dark:from-indigo-950/40 dark:via-violet-950/40 dark:to-amber-950/40 border border-indigo-200/50 dark:border-indigo-800/30 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Hybrid Harvester Engine
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Harvest Jobs with Firecrawl & Apify
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1 max-w-xl">
              Distribute tasks intelligently: Use <strong>Apify</strong> for broad job board sweeps across Google/LinkedIn, and <strong>Firecrawl</strong> to extract deep, structured job markdown directly from career sites.
            </p>
          </div>
          <button
            onClick={openSettings}
            className="self-start md:self-auto text-xs font-semibold px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 transition-colors shadow-xs"
          >
            Configure API Keys
          </button>
        </div>
      </div>

      {/* Source Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-zinc-100 dark:bg-zinc-800/50 p-1.5 rounded-2xl">
        <button
          onClick={() => setActiveSource('firecrawl')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeSource === 'firecrawl'
              ? 'bg-white dark:bg-zinc-900 text-orange-600 dark:text-orange-400 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4 text-orange-500" />
          <span>Firecrawl</span>
        </button>

        <button
          onClick={() => setActiveSource('apify')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeSource === 'apify'
              ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4 text-emerald-500" />
          <span>Apify Actors</span>
        </button>

        <button
          onClick={() => setActiveSource('ats')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeSource === 'ats'
              ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4 text-blue-500" />
          <span>Direct ATS (Free)</span>
        </button>

        <button
          onClick={() => setActiveSource('manual')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeSource === 'manual'
              ? 'bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 text-purple-500" />
          <span>Manual Drop</span>
        </button>
      </div>

      {/* Auto-Score Checkbox */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
        <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={autoScore}
            onChange={(e) => setAutoScore(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
          />
          <span className="font-medium">
            Auto-score candidate match with Gemini API on harvest
          </span>
        </label>
        <span className="text-[11px] text-zinc-400 hidden sm:inline">
          Uses your resume profile
        </span>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl text-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <p className="flex-1">{statusMessage.text}</p>
        </div>
      )}

      {/* TAB 1: Firecrawl */}
      {activeSource === 'firecrawl' && (
        <form onSubmit={handleFirecrawlSubmit} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Firecrawl Clean Scraper & Crawler
              </h3>
            </div>
            <p className="text-xs text-zinc-500">
              Scrapes any complex career page or job URL, bypasses JS rendering, and returns clean markdown structured with AI.
            </p>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="radio"
                name="firecrawlMode"
                value="scrape"
                checked={firecrawlMode === 'scrape'}
                onChange={() => setFirecrawlMode('scrape')}
                className="text-orange-500"
              />
              Single Job URL Scrape
            </label>
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="radio"
                name="firecrawlMode"
                value="crawl"
                checked={firecrawlMode === 'crawl'}
                onChange={() => setFirecrawlMode('crawl')}
                className="text-orange-500"
              />
              Career Page URL Discover / Crawl
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Target Career or Job Posting URL
            </label>
            <input
              type="url"
              required
              placeholder={
                firecrawlMode === 'scrape'
                  ? 'https://boards.greenhouse.io/stripe/jobs/... or https://linear.app/careers/engineer'
                  : 'https://linear.app/careers or https://anthropic.com/careers'
              }
              value={firecrawlUrl}
              onChange={(e) => setFirecrawlUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Harvesting with Firecrawl...</span>
              </>
            ) : (
              <>
                <Flame className="w-4 h-4" />
                <span>
                  {firecrawlMode === 'scrape' ? 'Scrape & Import Job' : 'Crawl Career Openings'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* TAB 2: Apify */}
      {activeSource === 'apify' && (
        <form onSubmit={handleApifySubmit} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bot className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Apify Actor Job Board Harvester
              </h3>
            </div>
            <p className="text-xs text-zinc-500">
              Run cloud actors to scrape job feeds from Google Jobs, LinkedIn, or Indeed into your pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Job Board Source
              </label>
              <select
                value={apifyProvider}
                onChange={(e) => setApifyProvider(e.target.value as typeof apifyProvider)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              >
                <option value="google-jobs">Google Jobs (apify/google-jobs-scraper)</option>
                <option value="linkedin">LinkedIn Jobs (bebity/linkedin-jobs-scraper)</option>
                <option value="indeed">Indeed (epctex/indeed-scraper)</option>
                <option value="custom">Custom Apify Actor ID</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Search Keywords
              </label>
              <input
                type="text"
                required
                value={apifyQuery}
                onChange={(e) => setApifyQuery(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer React"
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Location
              </label>
              <input
                type="text"
                value={apifyLocation}
                onChange={(e) => setApifyLocation(e.target.value)}
                placeholder="Remote or City, State"
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
          </div>

          {apifyProvider === 'custom' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Apify Actor ID
              </label>
              <input
                type="text"
                required
                placeholder="e.g. username/actor-name"
                value={apifyActorId}
                onChange={(e) => setApifyActorId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="w-36">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Max Results ({apifyMaxItems})
              </label>
              <input
                type="range"
                min="3"
                max="20"
                value={apifyMaxItems}
                onChange={(e) => setApifyMaxItems(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
            <div className="text-[11px] text-zinc-400 pt-3">
              Keeps Apify credits minimal and fast.
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Apify Actor... (takes ~30s)</span>
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" />
                <span>Search & Batch Import Jobs</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* TAB 3: Direct ATS */}
      {activeSource === 'ats' && (
        <form onSubmit={handleAtsSubmit} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Direct ATS Board Harvester (Zero API Cost)
              </h3>
            </div>
            <p className="text-xs text-zinc-500">
              Directly queries company public job boards without consuming third-party scraper credits.
            </p>
          </div>

          {/* Quick presets */}
          <div>
            <span className="text-xs font-medium text-zinc-500 mb-2 block">Quick Company Presets:</span>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Stripe', slug: 'stripe', platform: 'greenhouse' as const },
                { name: 'Figma', slug: 'figma', platform: 'greenhouse' as const },
                { name: 'OpenAI', slug: 'openai', platform: 'greenhouse' as const },
                { name: 'Linear', slug: 'linear', platform: 'ashby' as const },
                { name: 'Vercel', slug: 'vercel', platform: 'lever' as const },
                { name: 'Supabase', slug: 'supabase', platform: 'ashby' as const },
              ].map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => {
                    setAtsSlug(item.slug);
                    setAtsPlatform(item.platform);
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  {item.name} ({item.platform})
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                ATS Platform
              </label>
              <select
                value={atsPlatform}
                onChange={(e) => setAtsPlatform(e.target.value as typeof atsPlatform)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              >
                <option value="greenhouse">Greenhouse (boards-api.greenhouse.io)</option>
                <option value="lever">Lever (api.lever.co)</option>
                <option value="ashby">Ashby (api.ashbyhq.com)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Company Board Slug
              </label>
              <input
                type="text"
                required
                value={atsSlug}
                onChange={(e) => setAtsSlug(e.target.value)}
                placeholder="e.g. stripe, openai, linear"
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Role Keyword Filter
              </label>
              <input
                type="text"
                value={atsKeyword}
                onChange={(e) => setAtsKeyword(e.target.value)}
                placeholder="e.g. Engineer, Frontend, AI"
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Fetching Company Board...</span>
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                <span>Fetch Open Roles from {atsSlug.toUpperCase()}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* TAB 4: Manual */}
      {activeSource === 'manual' && (
        <form onSubmit={handleManualSubmit} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-purple-500" />
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Quick Job Paste / Manual Entry
              </h3>
            </div>
            <p className="text-xs text-zinc-500">
              Found a job manually? Paste it directly into your tracking pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                required
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="Senior Full Stack Engineer"
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={manualCompany}
                onChange={(e) => setManualCompany(e.target.value)}
                placeholder="Acme Corp"
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Location
              </label>
              <input
                type="text"
                value={manualLocation}
                onChange={(e) => setManualLocation(e.target.value)}
                placeholder="Remote, US or City"
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Application URL
              </label>
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Job Description / Notes
            </label>
            <textarea
              rows={4}
              value={manualDescription}
              onChange={(e) => setManualDescription(e.target.value)}
              placeholder="Paste responsibilities, requirements, or tech stack here..."
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add to Pipeline</span>
          </button>
        </form>
      )}
    </div>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
