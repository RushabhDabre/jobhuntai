'use client';

import React from 'react';
import { Job, JobStatus } from '@/types/job';
import {
  Building2,
  MapPin,
  IndianRupee,
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

const COLUMNS: { id: JobStatus; title: string; dotColor: string }[] = [
  { id: 'discovered', title: 'Discovered', dotColor: 'bg-zinc-400' },
  { id: 'saved', title: 'Saved / Reviewing', dotColor: 'bg-blue-500' },
  { id: 'applied', title: 'Applied', dotColor: 'bg-purple-500' },
  { id: 'interviewing', title: 'Interviewing', dotColor: 'bg-amber-500' },
  { id: 'offer', title: 'Offer Received', dotColor: 'bg-emerald-500' },
  { id: 'rejected', title: 'Archived', dotColor: 'bg-rose-400' },
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

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'firecrawl':
        return (
          <span className="flex items-center gap-1 text-[11px] text-orange-600 dark:text-orange-400 font-medium">
            <Flame className="w-3 h-3" /> Firecrawl
          </span>
        );
      case 'apify':
        return (
          <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <Bot className="w-3 h-3" /> Apify
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
            <Globe className="w-3 h-3" /> {source}
          </span>
        );
    }
  };

  return (
    <div className="flex gap-5 overflow-x-auto pb-8 pt-1 min-h-[calc(100vh-220px)]">
      {COLUMNS.map((col) => {
        const colJobs = filteredJobs.filter((j) => j.status === col.id);
        const colIndex = STATUS_FLOW.indexOf(col.id);

        return (
          <div
            key={col.id}
            className="flex-shrink-0 w-80 bg-zinc-100/60 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                  {col.title}
                </h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shadow-xs">
                {colJobs.length}
              </span>
            </div>

            {/* Column Cards */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[72vh] pr-0.5">
              {colJobs.length === 0 ? (
                <div className="h-28 flex items-center justify-center text-xs text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl">
                  No roles in {col.title}
                </div>
              ) : (
                colJobs.map((job) => {
                  return (
                    <div
                      key={job.id}
                      className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-xl p-4 shadow-xs hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
                      onClick={() => onSelectJob(job)}
                    >
                      <div className="space-y-2">
                        {/* Top: Source & Score */}
                        <div className="flex items-center justify-between gap-1">
                          {getSourceBadge(job.source)}

                          {job.matchScore !== undefined ? (
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                job.matchScore >= 90
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : job.matchScore >= 75
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              }`}
                            >
                              <Sparkles className="w-3 h-3" />
                              {job.matchScore}%
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-400">Unscored</span>
                          )}
                        </div>

                        {/* Title & Company */}
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                          {job.title}
                        </h4>

                        <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{job.company}</span>
                        </div>

                        {/* Location & Salary */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            <MapPin className="w-2.5 h-2.5" />
                            {job.location}
                          </span>
                          {job.salary && job.salary !== 'Not Disclosed' ? (
                            <span className="inline-flex items-center gap-0.5 text-[11px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold">
                              <IndianRupee className="w-2.5 h-2.5" />
                              {job.salary}
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                              Not Disclosed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer: Step Controls */}
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
                          className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          title="Move to previous stage"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {job.url && (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-zinc-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
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
                          className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          title="Advance to next stage"
                        >
                          <ChevronRight className="w-4 h-4" />
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
