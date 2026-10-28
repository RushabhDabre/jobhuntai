'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  ExternalLink,
  Building2,
  MapPin,
  IndianRupee,
  Copy,
  Check,
  Loader2,
  FileText,
  Send,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Clock,
} from 'lucide-react';
import { Job, JobStatus, MatchAnalysis } from '@/types/job';
import { getSafeJobUrl, getPlatformSearchUrls } from '@/lib/jobLinks';
import { getAuthHeaders } from '@/lib/auth';

interface JobDetailModalProps {
  job: Job | null;
  onClose: () => void;
  onUpdateJob: (updated: Job) => void;
}

export default function JobDetailModal({ job, onClose, onUpdateJob }: JobDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeTab, setActiveTab] = useState<'match' | 'description' | 'notes'>('match');
  const [evaluating, setEvaluating] = useState(false);
  const [localNotes, setLocalNotes] = useState('');
  const [localStatus, setLocalStatus] = useState<JobStatus>('discovered');
  const [localAppliedDate, setLocalAppliedDate] = useState('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [tokenLimitNotice, setTokenLimitNotice] = useState<{
    resetTime: string;
    message: string;
    service: string;
  } | null>(null);

  // Sync state on job change and handle native dialog showModal
  useEffect(() => {
    const dialog = dialogRef.current;
    if (job) {
      setLocalNotes(job.notes || '');
      setLocalStatus(job.status || 'discovered');
      setLocalAppliedDate(job.appliedDate || '');
      setErrorNotice(null);
      setTokenLimitNotice(null);
      if (dialog && !dialog.open) {
        dialog.showModal();
      }
    } else if (dialog && dialog.open) {
      dialog.close();
    }
  }, [job]);

  if (!job) return null;

  // Run Gemini Match Evaluation
  const handleEvaluateMatch = async () => {
    setEvaluating(true);
    setErrorNotice(null);
    setTokenLimitNotice(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}/match`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!data.success) {
        if (data.formattedError?.isRateLimited) {
          setTokenLimitNotice({
            resetTime: data.formattedError.resetTime,
            message: data.formattedError.message,
            service: data.formattedError.service,
          });
          return;
        }
        setErrorNotice(data.formattedError?.message || data.error || 'Evaluation failed');
        return;
      }
      onUpdateJob(data.job);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Evaluation failed';
      setErrorNotice(msg);
    } finally {
      setEvaluating(false);
    }
  };

  // Save Notes and Status
  const handleSaveNotesAndStatus = async () => {
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          status: localStatus,
          notes: localNotes,
          appliedDate: localAppliedDate || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onUpdateJob(data.job);
      }
    } catch (err) {
      console.error('Failed to save job updates:', err);
    }
  };

  const analysis: MatchAnalysis | undefined = job.matchAnalysis;

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      className="m-auto backdrop:bg-black/60 backdrop:backdrop-blur-xs p-0 bg-transparent border-0 max-w-4xl w-full text-zinc-900 dark:text-zinc-100 open:animate-in open:fade-in open:zoom-in-95 duration-150"
      style={{ overscrollBehavior: 'contain' }}
    >
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="p-6 sm:p-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {job.source}
              </span>
              <span className="text-xs text-zinc-400">Added {new Date(job.createdAt).toLocaleDateString()}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
              {job.title}
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 pt-1">
              <div className="flex items-center gap-1 font-semibold text-zinc-900 dark:text-white">
                <Building2 className="w-4 h-4 text-indigo-500" />
                <span>{job.company}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-zinc-400" />
                <span>{job.location}</span>
              </div>
              {job.salary && job.salary !== 'Not Disclosed' ? (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <IndianRupee className="w-4 h-4" />
                    <span>{job.salary}</span>
                  </div>
                </>
              ) : (
                <>
                  <span>•</span>
                  <span className="text-zinc-400 text-xs">Salary: Not Disclosed</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={getSafeJobUrl(job)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white transition-colors"
            >
              <span>Apply / Official Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Multi-Platform Search Bar (Guaranteed No 404s) */}
        {(() => {
          const platformUrls = getPlatformSearchUrls(job);
          return (
            <div className="flex flex-wrap items-center gap-2 px-6 sm:px-7 py-2.5 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 text-[11px]">
              <span className="font-semibold text-zinc-500">Live Search On:</span>
              <a
                href={platformUrls.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:underline flex items-center gap-1 font-medium transition-colors"
              >
                <span>LinkedIn India</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <a
                href={platformUrls.googleJobs}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:underline flex items-center gap-1 font-medium transition-colors"
              >
                <span>Google Jobs</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <a
                href={platformUrls.naukri}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:underline flex items-center gap-1 font-medium transition-colors"
              >
                <span>Naukri</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <a
                href={platformUrls.indeed}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:underline flex items-center gap-1 font-medium transition-colors"
              >
                <span>Indeed India</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          );
        })()}

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 sm:px-7 gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('match')}
            className={`py-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'match'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Match Analysis</span>
            {job.matchScore !== undefined && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold">
                {job.matchScore}%
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('description')}
            className={`py-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'description'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Job Description</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'notes'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Status & Notes</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6">
          {tokenLimitNotice && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                    ⚡ Out of API Tokens ({tokenLimitNotice.service})
                  </h4>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300">
                    Replenishes at {tokenLimitNotice.resetTime}
                  </span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  {tokenLimitNotice.message}
                </p>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                  You can wait for the cooldown or enter another API key in Settings (⚙️).
                </p>
              </div>
            </div>
          )}

          {errorNotice && (
            <div className="flex items-center gap-2 p-3.5 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          {/* TAB 1: AI FIT MATCH */}
          {activeTab === 'match' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex flex-col items-center justify-center font-black shadow-xs">
                    <span className="text-xl leading-none">{job.matchScore ?? '—'}</span>
                    <span className="text-[10px] font-bold tracking-wider opacity-80">%</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Recommendation
                    </span>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      {analysis?.recommendation || 'Evaluation Pending'}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Evaluated against your active resume & Indian market preferences
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleEvaluateMatch}
                  disabled={evaluating}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {evaluating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Evaluating with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{job.matchScore ? 'Re-Evaluate Match' : 'Run Gemini AI Match'}</span>
                    </>
                  )}
                </button>
              </div>

              {analysis ? (
                <div className="space-y-5">
                  {/* Key Match Alignment */}
                  {analysis.summary && !analysis.summary.toLowerCase().includes('generic career portal boilerplate') && (
                    <div className="bg-white dark:bg-zinc-800/40 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed">
                        {analysis.summary}
                      </p>
                    </div>
                  )}

                  {/* India Market Parameter Match */}
                  {analysis.indiaRelevance && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                        <span className="text-[11px] font-semibold text-zinc-500 block mb-1">
                          📍 Location Fit:
                        </span>
                        <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                          {analysis.indiaRelevance.locationFit}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                        <span className="text-[11px] font-semibold text-zinc-500 block mb-1">
                          💰 Compensation Fit:
                        </span>
                        <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                          {analysis.indiaRelevance.salaryFit}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                        <span className="text-[11px] font-semibold text-zinc-500 block mb-1">
                          ⏳ Notice Period Fit:
                        </span>
                        <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                          {analysis.indiaRelevance.noticePeriodFit}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Strengths & Gaps Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div className="p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Key Alignment & Strengths</span>
                      </div>
                      <ul className="space-y-2 text-xs text-zinc-700 dark:text-zinc-200">
                        {analysis.strengths?.map((str, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold shrink-0">✓</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Gaps */}
                    <div className="p-5 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10 space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>Skill Gaps / Things to Prepare</span>
                      </div>
                      <ul className="space-y-2 text-xs text-zinc-700 dark:text-zinc-200">
                        {analysis.gaps?.length ? (
                          analysis.gaps.map((gap, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-amber-500 font-bold shrink-0">!</span>
                              <span>{gap}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-zinc-400 italic">No major skill gaps identified.</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Interview Talking Points */}
                  {analysis.interviewTalkingPoints?.length > 0 && (
                    <div className="p-5 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/40 bg-indigo-50/10 dark:bg-indigo-950/10 space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                        <Lightbulb className="w-4 h-4 text-indigo-500" />
                        <span>Recommended Screening Talking Points</span>
                      </div>
                      <ul className="space-y-2 text-xs text-zinc-700 dark:text-zinc-200">
                        {analysis.interviewTalkingPoints.map((point, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                  <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                  <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">
                    Fit evaluation not generated yet
                  </h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                    Click &quot;Run Gemini AI Match&quot; above to cross-reference your resume and discover your match score.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DESCRIPTION */}
          {activeTab === 'description' && (
            <div className="space-y-4">
              {job.requirements && job.requirements.length > 0 && (
                <div className="bg-zinc-50 dark:bg-zinc-800/40 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                    Key Role Requirements
                  </h4>
                  <ul className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                    {job.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-zinc-50 dark:bg-zinc-800/40 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {job.description || 'No description provided for this job.'}
              </div>
            </div>
          )}

          {/* TAB 4: STATUS & NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Pipeline Stage
                </label>
                <select
                  value={localStatus}
                  onChange={(e) => setLocalStatus(e.target.value as JobStatus)}
                  className="w-full text-sm p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                >
                  <option value="discovered">Discovered</option>
                  <option value="saved">Saved / Reviewing</option>
                  <option value="applied">Applied</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="offer">Offer Received</option>
                  <option value="rejected">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Applied Date
                </label>
                <input
                  type="date"
                  value={localAppliedDate}
                  onChange={(e) => setLocalAppliedDate(e.target.value)}
                  className="w-full text-sm p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Private Application Notes
                </label>
                <textarea
                  rows={6}
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                  placeholder="e.g. Connected with technical recruiter on LinkedIn; HR round scheduled for Thursday."
                  className="w-full text-sm p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                />
              </div>

              <button
                onClick={handleSaveNotesAndStatus}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
