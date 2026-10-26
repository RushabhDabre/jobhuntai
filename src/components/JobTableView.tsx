'use client';

import React from 'react';
import { Job, JobStatus } from '@/types/job';
import {
  Sparkles,
  ExternalLink,
  Trash2,
  Building2,
  MapPin,
  Clock,
} from 'lucide-react';

interface JobTableViewProps {
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

export default function JobTableView({
  jobs,
  onSelectJob,
  onUpdateStatus,
  onDeleteJob,
  searchFilter,
  minScoreFilter,
}: JobTableViewProps) {
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      job.company.toLowerCase().includes(searchFilter.toLowerCase()) ||
      job.location.toLowerCase().includes(searchFilter.toLowerCase()) ||
      job.source.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesScore =
      minScoreFilter === 0 || (job.matchScore !== undefined && job.matchScore >= minScoreFilter);

    return matchesSearch && matchesScore;
  });

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs mb-10">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <th className="py-3 px-4">Role & Company</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Source</th>
              <th className="py-3 px-4">Match Score</th>
              <th className="py-3 px-4">Pipeline Status</th>
              <th className="py-3 px-4">Added</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
            {filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-400">
                  No matching jobs found in your database.
                </td>
              </tr>
            ) : (
              filteredJobs.map((job) => {
                return (
                  <tr
                    key={job.id}
                    onClick={() => onSelectJob(job)}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors"
                  >
                    {/* Title & Company */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 transition-colors">
                          {job.title}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{job.company}</span>
                          {job.salary && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                {job.salary}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 text-xs text-zinc-600 dark:text-zinc-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{job.location}</span>
                      </div>
                    </td>

                    {/* Source */}
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {job.source}
                      </span>
                    </td>

                    {/* Match Score */}
                    <td className="py-3.5 px-4">
                      {job.matchScore !== undefined ? (
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              job.matchScore >= 85
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : job.matchScore >= 70
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                : job.matchScore >= 50
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}
                          >
                            <Sparkles className="w-3 h-3" />
                            {job.matchScore}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">Not evaluated</span>
                      )}
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={job.status}
                        onChange={(e) => onUpdateStatus(job.id, e.target.value as JobStatus)}
                        className="text-xs font-medium bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Added Date */}
                    <td className="py-3.5 px-4 text-xs text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {job.url && (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            title="Open posting"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => onDeleteJob(job.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
