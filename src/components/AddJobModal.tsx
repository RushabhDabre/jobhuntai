'use client';

import React, { useState } from 'react';
import { X, Plus, Sparkles, Loader2, Flame } from 'lucide-react';
import { Job } from '@/types/job';

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobAdded: (job: Job) => void;
}

export default function AddJobModal({ isOpen, onClose, onJobAdded }: AddJobModalProps) {
  const [mode, setMode] = useState<'url' | 'manual'>('url');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('Remote');
  const [description, setDescription] = useState('');
  const [salary, setSalary] = useState('');
  const [autoScore, setAutoScore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'url') {
        const res = await fetch('/api/harvest/firecrawl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, autoScore }),
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to scrape job');
        }
        onJobAdded(data.job);
        onClose();
      } else {
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            company,
            location,
            salary: salary || undefined,
            url,
            description,
            source: 'manual',
            status: 'discovered',
          }),
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to save job');
        }
        onJobAdded(data.job);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error adding job';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Plus className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Add New Job</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setMode('url')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                mode === 'url' ? 'bg-white dark:bg-zinc-900 text-indigo-600 shadow-xs' : 'text-zinc-500'
              }`}
            >
              Scrape URL (Firecrawl/AI)
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                mode === 'manual' ? 'bg-white dark:bg-zinc-900 text-indigo-600 shadow-xs' : 'text-zinc-500'
              }`}
            >
              Manual Details
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'url' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Job Posting URL
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://company.com/jobs/role-id or Greenhouse/Lever link"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-500" />
                    Firecrawl will scrape the full description and requirements.
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-600 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={autoScore}
                    onChange={(e) => setAutoScore(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span>Auto-score match with Gemini immediately</span>
                </label>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Frontend"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Company *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Stripe"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="Remote or City"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Salary (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="$160k - $200k"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Job Description
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Paste job details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Add to Pipeline</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
