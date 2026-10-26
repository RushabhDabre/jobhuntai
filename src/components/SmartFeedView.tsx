'use client';

import React from 'react';
import { Job, JobStatus } from '@/types/job';
import {
  Sparkles,
  ExternalLink,
  Building2,
  MapPin,
  IndianRupee,
  Briefcase,
  Clock,
  ArrowRight,
  Send,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

interface SmartFeedViewProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  onUpdateStatus: (jobId: string, newStatus: JobStatus) => void;
  onDeleteJob: (jobId: string) => void;
  searchFilter: string;
  minScoreFilter: number;
}

const STATUS_OPTIONS: { id: JobStatus; label: string }[] = [
  { id: 'discovered', label: 'Discovered' },
  { id: 'saved', label: 'Saved' },
  { id: 'applied', label: 'Applied' },
  { id: 'interviewing', label: 'Interviewing' },
  { id: 'offer', label: 'Offer' },
  { id: 'rejected', label: 'Archived / Rejected' },
];

export default function SmartFeedView({
  jobs,
  onSelectJob,
  onUpdateStatus,
  onDeleteJob,
  searchFilter,
  minScoreFilter,
}: SmartFeedViewProps) {
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      job.company.toLowerCase().includes(searchFilter.toLowerCase()) ||
      job.location.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (job.city && job.city.toLowerCase().includes(searchFilter.toLowerCase()));

    const matchesScore =
      minScoreFilter === 0 || (job.matchScore !== undefined && job.matchScore >= minScoreFilter);

    return matchesSearch && matchesScore;
  });

  const getScoreBadge = (score?: number) => {
    if (score === undefined) {
      return (
        <span className="text-xs font-medium px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
          Unscored
        </span>
      );
    }
    if (score >= 90) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <Sparkles className="w-3.5 h-3.5" />
          {score}% • Strong Fit
        </span>
      );
    }
    if (score >= 75) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <Sparkles className="w-3.5 h-3.5" />
          {score}% • Good Match
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        <Sparkles className="w-3.5 h-3.5" />
        {score}% • Borderline
      </span>
    );
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-16">
      {filteredJobs.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center">
          <Briefcase className="w-10 h-10 mx-auto text-zinc-400 mb-3" />
          <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
            No jobs found matching your filters
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            Try adjusting your search keywords or visit the <strong>Harvester</strong> tab to discover more roles across Indian tech companies.
          </p>
        </div>
      ) : (
        filteredJobs.map((job) => {
          return (
            <div
              key={job.id}
              onClick={() => onSelectJob(job)}
              className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-start justify-between gap-5"
            >
              {/* Left Column: Job Info */}
              <div className="space-y-3 flex-1">
                {/* Header row: Company, Source, Score */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-500" />
                    {job.company}
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <span className="text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    {job.source}
                  </span>
                  {getScoreBadge(job.matchScore)}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {job.title}
                </h3>

                {/* Key metadata pills: Location, CTC, Experience */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/70 dark:border-zinc-700/60 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    {job.location}
                  </span>

                  {(job.salaryInLpa || job.salary) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 font-semibold">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                      {job.salaryInLpa || job.salary}
                    </span>
                  )}

                  {job.experienceRequired && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/70 dark:border-zinc-700/60 font-medium">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {job.experienceRequired}
                    </span>
                  )}
                </div>

                {/* AI Match Summary Snippet */}
                {job.matchAnalysis && (
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 mr-1.5">
                      Why it matches:
                    </span>
                    {job.matchAnalysis.summary}
                  </div>
                )}
              </div>

              {/* Right Column: Actions & Pipeline Status */}
              <div
                className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Pipeline Status Selector */}
                <select
                  value={job.status}
                  onChange={(e) => onUpdateStatus(job.id, e.target.value as JobStatus)}
                  className="text-xs font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      Status: {opt.label}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  {job.url && (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                      title="Open external job posting"
                    >
                      <span>Apply</span>
                      <ExternalLink className="w-3 h-3 text-zinc-400" />
                    </a>
                  )}

                  <button
                    onClick={() => onSelectJob(job)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <span>View AI Analysis</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => onDeleteJob(job.id)}
                    className="p-2 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Remove job"
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
  );
}
