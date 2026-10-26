'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ExternalLink,
  Building2,
  MapPin,
  DollarSign,
  Copy,
  Check,
  Loader2,
  FileText,
  Send,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';
import { Job, JobStatus, MatchAnalysis } from '@/types/job';

interface JobDetailModalProps {
  job: Job | null;
  onClose: () => void;
  onUpdateJob: (updated: Job) => void;
}

export default function JobDetailModal({ job, onClose, onUpdateJob }: JobDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'match' | 'pitch' | 'description' | 'notes'>('match');
  const [evaluating, setEvaluating] = useState(false);
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [pitchType, setPitchType] = useState<'cover_letter' | 'cold_email' | 'linkedin_dm'>('cover_letter');
  const [pitchContent, setPitchContent] = useState(job?.coverLetter || job?.coldPitch || '');
  const [copied, setCopied] = useState(false);
  const [localNotes, setLocalNotes] = useState(job?.notes || '');
  const [localStatus, setLocalStatus] = useState<JobStatus>(job?.status || 'discovered');
  const [localAppliedDate, setLocalAppliedDate] = useState(job?.appliedDate || '');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  if (!job) return null;

  // Run Gemini Match Evaluation
  const handleEvaluateMatch = async () => {
    setEvaluating(true);
    setErrorNotice(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}/match`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Evaluation failed');
      }
      onUpdateJob(data.job);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Evaluation failed';
      setErrorNotice(msg);
    } finally {
      setEvaluating(false);
    }
  };

  // Generate Pitch / Cover Letter with Gemini
  const handleGeneratePitch = async () => {
    setGeneratingPitch(true);
    setErrorNotice(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}/pitch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pitchType }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Pitch generation failed');
      }
      setPitchContent(data.pitch);
      onUpdateJob(data.job);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      setErrorNotice(msg);
    } finally {
      setGeneratingPitch(false);
    }
  };

  // Save Notes and Status
  const handleSaveNotesAndStatus = async () => {
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: localStatus,
          notes: localNotes,
          appliedDate: localAppliedDate || undefined,
          coverLetter: pitchType === 'cover_letter' ? pitchContent : job.coverLetter,
          coldPitch: pitchType !== 'cover_letter' ? pitchContent : job.coldPitch,
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pitchContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const analysis: MatchAnalysis | undefined = job.matchAnalysis;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
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
              {job.salary && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <DollarSign className="w-4 h-4" />
                    <span>{job.salary}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                <span>Posting</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('match')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'match'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Fit Match</span>
            {job.matchScore !== undefined && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                {job.matchScore}%
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('pitch')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'pitch'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>AI Pitch & Letters</span>
          </button>

          <button
            onClick={() => setActiveTab('description')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
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
            className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorNotice && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          {/* TAB 1: AI FIT MATCH */}
          {activeTab === 'match' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-tr from-indigo-50/60 to-violet-50/40 dark:from-indigo-950/30 dark:to-violet-950/20 border border-indigo-200/50 dark:border-indigo-800/40">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex flex-col items-center justify-center font-black shadow-md shadow-indigo-600/20">
                    <span className="text-xl leading-none">{job.matchScore ?? '—'}</span>
                    <span className="text-[10px] tracking-wider font-semibold opacity-80">%</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Recommendation
                    </span>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      {analysis?.recommendation || 'Evaluation Pending'}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Evaluated against your active resume & target roles
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleEvaluateMatch}
                  disabled={evaluating}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {evaluating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{job.matchScore ? 'Re-Evaluate with Gemini' : 'Run Gemini AI Match'}</span>
                    </>
                  )}
                </button>
              </div>

              {analysis ? (
                <div className="space-y-5">
                  {/* Summary */}
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-800 rounded-2xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                      Executive Summary
                    </h4>
                    <p className="text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed">
                      {analysis.summary}
                    </p>
                  </div>

                  {/* Strengths & Gaps Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div className="p-4 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Key Alignment & Strengths</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-200">
                        {analysis.strengths?.map((str, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold shrink-0">✓</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Gaps */}
                    <div className="p-4 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>Skill Gaps & Considerations</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-200">
                        {analysis.gaps?.length ? (
                          analysis.gaps.map((gap, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-amber-500 font-bold shrink-0">!</span>
                              <span>{gap}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-zinc-400 italic">No significant gaps detected.</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Interview Talking Points */}
                  {analysis.interviewTalkingPoints?.length > 0 && (
                    <div className="p-4 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/40 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                        <Lightbulb className="w-4 h-4 text-indigo-500" />
                        <span>Recommended Interview Talking Points</span>
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
                <div className="text-center py-12 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl p-6">
                  <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2 animate-bounce" />
                  <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">
                    Fit analysis not generated yet
                  </h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                    Click &quot;Run Gemini AI Match&quot; above to cross-reference this role against your resume and get tactical tips.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AI PITCH & COVER LETTER */}
          {activeTab === 'pitch' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setPitchType('cover_letter')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      pitchType === 'cover_letter'
                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    Cover Letter
                  </button>
                  <button
                    onClick={() => setPitchType('cold_email')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      pitchType === 'cold_email'
                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    Cold Email (Hiring Mgr)
                  </button>
                  <button
                    onClick={() => setPitchType('linkedin_dm')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      pitchType === 'linkedin_dm'
                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    LinkedIn DM
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGeneratePitch}
                    disabled={generatingPitch}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {generatingPitch ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Crafting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate with Gemini</span>
                      </>
                    )}
                  </button>

                  {pitchContent && (
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <textarea
                rows={12}
                value={pitchContent}
                onChange={(e) => setPitchContent(e.target.value)}
                placeholder="Click 'Generate with Gemini' to craft a tailored message based on your resume and this job's requirements..."
                className="w-full text-xs sm:text-sm p-4 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          )}

          {/* TAB 3: DESCRIPTION */}
          {activeTab === 'description' && (
            <div className="space-y-4">
              {job.requirements && job.requirements.length > 0 && (
                <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                    Extracted Requirements
                  </h4>
                  <ul className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
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
                  <option value="offer">Offer</option>
                  <option value="rejected">Archived / Rejected</option>
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
                  Private Notes & Follow-ups
                </label>
                <textarea
                  rows={6}
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                  placeholder="e.g. Connected with engineering recruiter on LinkedIn; next round interview scheduled for Friday."
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
    </div>
  );
}
