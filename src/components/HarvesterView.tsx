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
  Building2,
  MapPin,
  IndianRupee,
} from 'lucide-react';
import { Job } from '@/types/job';
import { getAuthHeaders } from '@/lib/auth';

interface HarvesterViewProps {
  onJobsImported: (jobs: Job[]) => void;
  openSettings: () => void;
}

const INDIAN_TECH_PRESETS = [
  { name: 'Razorpay', slug: 'razorpay', platform: 'greenhouse' as const, city: 'Bengaluru' },
  { name: 'Swiggy', slug: 'swiggy', platform: 'lever' as const, city: 'Bengaluru' },
  { name: 'CRED', slug: 'cred', platform: 'greenhouse' as const, city: 'Bengaluru' },
  { name: 'BrowserStack', slug: 'browserstack', platform: 'ashby' as const, city: 'Mumbai / Remote' },
  { name: 'Atlassian India', slug: 'atlassian', platform: 'greenhouse' as const, city: 'Bengaluru / Remote' },
  { name: 'Zepto', slug: 'zepto', platform: 'lever' as const, city: 'Bengaluru / Mumbai' },
  { name: 'Postman', slug: 'postman', platform: 'greenhouse' as const, city: 'Bengaluru / Remote' },
  { name: 'Hasura', slug: 'hasura', platform: 'lever' as const, city: 'Bengaluru / Remote' },
];

export default function HarvesterView({ onJobsImported, openSettings }: HarvesterViewProps) {
  const [activeSource, setActiveSource] = useState<'ats' | 'apify' | 'firecrawl' | 'manual'>('ats');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [autoScore, setAutoScore] = useState(true);

  // ATS State
  const [atsPlatform, setAtsPlatform] = useState<'greenhouse' | 'lever' | 'ashby'>('greenhouse');
  const [atsSlug, setAtsSlug] = useState('razorpay');
  const [atsKeyword, setAtsKeyword] = useState('Engineer');

  // Apify State
  const [apifyProvider, setApifyProvider] = useState<'google-jobs' | 'linkedin' | 'indeed' | 'custom'>('google-jobs');
  const [apifyQuery, setApifyQuery] = useState('Full Stack Engineer');
  const [apifyLocation, setApifyLocation] = useState('Bengaluru, India');
  const [apifyMaxItems, setApifyMaxItems] = useState(5);
  const [apifyActorId, setApifyActorId] = useState('');

  // Firecrawl State
  const [firecrawlUrl, setFirecrawlUrl] = useState('');
  const [firecrawlMode, setFirecrawlMode] = useState<'scrape' | 'crawl'>('scrape');

  // Manual State
  const [manualTitle, setManualTitle] = useState('');
  const [manualCompany, setManualCompany] = useState('');
  const [manualLocation, setManualLocation] = useState('Bengaluru, India');
  const [manualSalary, setManualSalary] = useState('₹25 - ₹35 LPA');
  const [manualUrl, setManualUrl] = useState('');
  const [manualDescription, setManualDescription] = useState('');

  // Run ATS Board Scrape
  const handleAtsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!atsSlug) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/harvest/ats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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
          text: `Directly harvested ${data.jobs.length} open roles from ${atsSlug}'s public board!`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `No open roles found matching "${atsKeyword}" on ${atsSlug}'s board. Try a broader keyword like "Developer" or leave it blank.`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ATS scrape failed';
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
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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
        if (data.formattedError) {
          setStatusMessage({
            type: 'error',
            text: data.formattedError.message || data.error || 'Apify search failed',
          });
          return;
        }
        throw new Error(data.error || 'Apify search failed');
      }

      if (data.jobs && data.jobs.length > 0) {
        onJobsImported(data.jobs);
        setStatusMessage({
          type: 'success',
          text: `Successfully harvested and imported ${data.jobs.length} roles from Apify for ${apifyLocation}!`,
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

  // Run Firecrawl
  const handleFirecrawlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firecrawlUrl) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/harvest/firecrawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          url: firecrawlUrl,
          mode: firecrawlMode,
          autoScore,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        if (data.formattedError) {
          setStatusMessage({
            type: 'error',
            text: data.formattedError.message || data.error || 'Firecrawl failed',
          });
          return;
        }
        throw new Error(data.error || 'Firecrawl failed');
      }

      if (data.mode === 'crawl') {
        setStatusMessage({
          type: 'success',
          text: `Found ${data.foundLinks?.length || 0} candidate job links from career portal.`,
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

  // Manual Job Submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualCompany) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          title: manualTitle,
          company: manualCompany,
          location: manualLocation,
          salaryInLpa: manualSalary || undefined,
          salary: manualSalary || undefined,
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
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Harvester Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-2">
            🇮🇳 India Job Discovery Engine
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Harvest Real Tech Jobs in India
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-xl">
            Distribute tasks across direct company ATS boards (Razorpay, Swiggy, BrowserStack, Atlassian), Apify (LinkedIn/Google Jobs India), and Firecrawl for deep career page extraction.
          </p>
        </div>
        <button
          onClick={openSettings}
          className="self-start sm:self-auto text-xs font-semibold px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
        >
          API Settings
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-zinc-100 dark:bg-zinc-800/60 p-1.5 rounded-xl text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveSource('ats')}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all cursor-pointer ${
            activeSource === 'ats'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-bold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-blue-500" />
          <span>Direct ATS (Free)</span>
        </button>

        <button
          onClick={() => setActiveSource('apify')}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all cursor-pointer ${
            activeSource === 'apify'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-bold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <Bot className="w-4 h-4 text-emerald-500" />
          <span>Apify (LinkedIn/Google)</span>
        </button>

        <button
          onClick={() => setActiveSource('firecrawl')}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all cursor-pointer ${
            activeSource === 'firecrawl'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-bold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <Flame className="w-4 h-4 text-orange-500" />
          <span>Firecrawl Scraper</span>
        </button>

        <button
          onClick={() => setActiveSource('manual')}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all cursor-pointer ${
            activeSource === 'manual'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-bold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <FileText className="w-4 h-4 text-purple-500" />
          <span>Manual Drop</span>
        </button>
      </div>

      {/* Auto-Score Banner */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
        <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={autoScore}
            onChange={(e) => setAutoScore(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded"
          />
          <span className="font-semibold">
            Auto-score match with Gemini AI immediately upon harvesting
          </span>
        </label>
        <span className="text-xs text-zinc-400 hidden sm:inline">
          Evaluates against your resume & Indian market criteria
        </span>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl text-xs sm:text-sm ${
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
          <p className="flex-1 font-medium">{statusMessage.text}</p>
        </div>
      )}

      {/* TAB 1: Direct ATS (Top Indian Startups & Tech Giants) */}
      {activeSource === 'ats' && (
        <form onSubmit={handleAtsSubmit} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Direct Indian Tech Public ATS Harvester (Zero API Cost)
              </h3>
            </div>
            <p className="text-xs text-zinc-500">
              Directly fetches real, active openings from company public career boards with zero scraper fees.
            </p>
          </div>

          {/* Quick presets */}
          <div>
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
              1-Click Indian Tech Company Presets:
            </span>
            <div className="flex flex-wrap gap-2">
              {INDIAN_TECH_PRESETS.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => {
                    setAtsSlug(item.slug);
                    setAtsPlatform(item.platform);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    atsSlug === item.slug
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                  }`}
                >
                  <span className="font-semibold">{item.name}</span>
                  <span className="text-zinc-400 text-[10px] ml-1.5">({item.city})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                ATS Platform
              </label>
              <select
                value={atsPlatform}
                onChange={(e) => setAtsPlatform(e.target.value as typeof atsPlatform)}
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
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
                placeholder="e.g. razorpay, cred, swiggy"
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Role Filter Keyword
              </label>
              <input
                type="text"
                value={atsKeyword}
                onChange={(e) => setAtsKeyword(e.target.value)}
                placeholder="e.g. Engineer, Frontend, Fullstack"
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Harvesting roles from {atsSlug}...</span>
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                <span>Fetch Active Roles from {atsSlug.toUpperCase()}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* TAB 2: Apify */}
      {activeSource === 'apify' && (
        <form onSubmit={handleApifySubmit} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bot className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Apify Job Search (LinkedIn & Google Jobs India)
              </h3>
            </div>
            <p className="text-xs text-zinc-500">
              Run cloud scrapers to harvest recent postings across Indian job boards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Job Board Source
              </label>
              <select
                value={apifyProvider}
                onChange={(e) => setApifyProvider(e.target.value as typeof apifyProvider)}
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
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
                placeholder="e.g. SDE 2 React TypeScript"
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Location in India
              </label>
              <input
                type="text"
                value={apifyLocation}
                onChange={(e) => setApifyLocation(e.target.value)}
                placeholder="Bengaluru, Pune, Hyderabad, or Remote India"
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
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
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="w-48">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Max Results: <strong>{apifyMaxItems}</strong>
              </label>
              <input
                type="range"
                min="3"
                max="15"
                value={apifyMaxItems}
                onChange={(e) => setApifyMaxItems(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>
            <div className="text-xs text-zinc-400 pt-3">
              Keeps Apify credits minimal and fast.
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Apify Actor... (~30s)</span>
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" />
                <span>Search & Import Roles from {apifyLocation}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* TAB 3: Firecrawl */}
      {activeSource === 'firecrawl' && (
        <form onSubmit={handleFirecrawlSubmit} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Firecrawl Deep Career Page Scraper
              </h3>
            </div>
            <p className="text-xs text-zinc-500">
              Scrapes any complex career page or job URL, bypasses JS rendering, and returns clean markdown structured with AI.
            </p>
          </div>

          <div className="flex gap-4 text-xs font-semibold">
            <label className="flex items-center gap-2 cursor-pointer">
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
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="firecrawlMode"
                value="crawl"
                checked={firecrawlMode === 'crawl'}
                onChange={() => setFirecrawlMode('crawl')}
                className="text-orange-500"
              />
              Career Portal Crawl
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Target Job Posting or Career Page URL
            </label>
            <input
              type="url"
              required
              placeholder="e.g. https://careers.swiggy.com/job/1234 or https://razorpay.com/jobs"
              value={firecrawlUrl}
              onChange={(e) => setFirecrawlUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Scraping with Firecrawl...</span>
              </>
            ) : (
              <>
                <Flame className="w-4 h-4" />
                <span>Scrape & Import Job</span>
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
              Found a role on LinkedIn, Instahyre, or Naukri? Paste it directly into your tracking pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
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
                placeholder="e.g. Swiggy, Zepto, CRED"
                className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Location in India
              </label>
              <input
                type="text"
                value={manualLocation}
                onChange={(e) => setManualLocation(e.target.value)}
                placeholder="Bengaluru, Pune, Remote"
                className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Salary (₹ LPA)
              </label>
              <input
                type="text"
                value={manualSalary}
                onChange={(e) => setManualSalary(e.target.value)}
                placeholder="e.g. ₹28 - ₹35 LPA"
                className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Job Posting URL
              </label>
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Job Description / Requirements
            </label>
            <textarea
              rows={5}
              value={manualDescription}
              onChange={(e) => setManualDescription(e.target.value)}
              placeholder="Paste responsibilities and requirements..."
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Add Role to Matched Pipeline
          </button>
        </form>
      )}
    </div>
  );
}
