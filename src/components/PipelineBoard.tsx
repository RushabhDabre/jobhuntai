'use client';

import React from 'react';
import { Job, JobStatus } from '@/types/job';
import {
  Building2,
  MapPin,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ExternalLink,
  Flame,
  Globe,
  Bot,
} from 'lucide-react';

interface PipelineBoardProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  onUpdateStatus: (jobId: string, newStatus: JobStatus) => void;
  searchFilter: string;
  minScoreFilter: number;
}

const COLUMNS: { id: JobStatus; title: string; color: string; dotColor: string }[] = [
  { id: 'discovered', title: 'Discovered', color: 'bg-zinc-100/70 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800', dotColor: 'bg-zinc-400' },
  { id: 'saved', title: 'Saved / Reviewing', color: 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/40', dotColor: 'bg-blue-500' },
  { id: 'applied', title: 'Applied', color: 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/50 dark:border-purple-900/40', dotColor: 'bg-purple-500' },
  { id: 'interviewing', title: 'Interviewing', color: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-900/40', dotColor: 'bg-amber-500' },
  { id: 'offer', title: 'Offers', color: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-900/40', dotColor: 'bg-emerald-500' },
  { id: 'rejected', title: 'Archived / Rejected', color: 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-200/40 dark:border-rose-950/30', dotColor: 'bg-rose-400' },
];

const STATUS_FLOW: JobStatus[] = ['discovered', 'saved', 'applied', 'interviewing', 'offer', 'rejected'];

export default function PipelineBoard({
  jobs,
  onSelectJob,
  onUpdateStatus,
  searchFilter,
  minScoreFilter,
}: PipelineBoardProps) {
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      job.company.toLowerCase().includes(searchFilter.toLowerCase()) ||
      job.location.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesScore =
      minScoreFilter === 0 || (job.matchScore !== undefined && job.matchScore >= minScoreFilter);

    return matchesSearch && matchesScore;
  });

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'firecrawl':
        return <Flame className="w-3 h-3 text-orange-500" />;
      case 'apify':
        return <Bot className="w-3 h-3 text-emerald-500" />;
      case 'greenhouse':
      case 'lever':
      case 'ashby':
        return <Globe className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const getScoreBadgeColor = (score?: number) => {
    if (score === undefined) return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';
    if (score >= 85) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50';
    if (score >= 70) return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50';
    if (score >= 50) return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50';
    return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 min-h-[calc(100vh-210px)] pb-10">
      {COLUMNS.map((col) => {
        const colJobs = filteredJobs.filter((j) => j.status === col.id);
        const colIndex = STATUS_FLOW.indexOf(col.id);

        return (
          <div
            key={col.id}
            className={`rounded-2xl border p-3 flex flex-col ${col.color} transition-all`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                <h3 className="font-semibold text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-200">
                  {col.title}
                </h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shadow-xs border border-zinc-200/50 dark:border-zinc-700/50">
                {colJobs.length}
              </span>
            </div>

            {/* Cards container */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[75vh] pr-1">
              {colJobs.length === 0 ? (
                <div className="h-28 flex items-center justify-center text-xs text-zinc-400 dark:text-zinc-500 border border-dashed border-zinc-300/60 dark:border-zinc-800 rounded-xl">
                  No jobs here
                </div>
              ) : (
                colJobs.map((job) => {
                  return (
                    <div
                      key={job.id}
                      className="group bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-3.5 shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col justify-between cursor-pointer"
                      onClick={() => onSelectJob(job)}
                    >
                      <div>
                        {/* Source & Match Score Header */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            {getSourceIcon(job.source)}
                            <span>{job.source}</span>
                          </div>

                          {job.matchScore !== undefined ? (
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${getScoreBadgeColor(
                                job.matchScore
                              )}`}
                            >
                              <Sparkles className="w-3 h-3" />
                              {job.matchScore}%
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-400 italic">Unscored</span>
                          )}
                        </div>

                        {/* Title & Company */}
                        <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2 transition-colors">
                          {job.title}
                        </h4>

                        <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 mt-1">
                          <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="font-medium truncate">{job.company}</span>
                        </div>

                        {/* Location / Remote & Salary */}
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            <MapPin className="w-2.5 h-2.5" />
                            {job.location}
                          </span>
                          {job.salary && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                              <DollarSign className="w-2.5 h-2.5" />
                              {job.salary}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer: Movement Controls */}
                      <div
                        className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800/80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          disabled={colIndex === 0}
                          onClick={() => {
                            if (colIndex > 0) {
                              onUpdateStatus(job.id, STATUS_FLOW[colIndex - 1]);
                            }
                          }}
                          title="Move to previous stage"
                          className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>

                        {job.url && (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
                          >
                            <span>Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        <button
                          disabled={colIndex === STATUS_FLOW.length - 1}
                          onClick={() => {
                            if (colIndex < STATUS_FLOW.length - 1) {
                              onUpdateStatus(job.id, STATUS_FLOW[colIndex + 1]);
                            }
                          }}
                          title="Advance to next stage"
                          className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
