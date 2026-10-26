'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import PipelineBoard from '@/components/PipelineBoard';
import JobTableView from '@/components/JobTableView';
import HarvesterView from '@/components/HarvesterView';
import ProfileView from '@/components/ProfileView';
import JobDetailModal from '@/components/JobDetailModal';
import SettingsModal from '@/components/SettingsModal';
import AddJobModal from '@/components/AddJobModal';
import { Job, JobStatus } from '@/types/job';
import { Search, SlidersHorizontal, Sparkles, Plus, Loader2 } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'table' | 'harvester' | 'profile'>('pipeline');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);

  // Fetch jobs on mount
  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      if (data.success && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Compute live pipeline statistics
  const stats = useMemo(() => {
    const total = jobs.length;
    const scoredJobs = jobs.filter((j) => j.matchScore !== undefined);
    const avgScore =
      scoredJobs.length > 0
        ? Math.round(
            scoredJobs.reduce((acc, curr) => acc + (curr.matchScore || 0), 0) / scoredJobs.length
          )
        : 0;
    const appliedCount = jobs.filter((j) => j.status === 'applied').length;
    const interviewCount = jobs.filter((j) => j.status === 'interviewing').length;

    return { total, avgScore, appliedCount, interviewCount };
  }, [jobs]);

  // Status Updater
  const handleUpdateStatus = async (jobId: string, newStatus: JobStatus) => {
    // Optimistic update
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: newStatus, updatedAt: new Date().toISOString() } : j))
    );
    if (selectedJob && selectedJob.id === jobId) {
      setSelectedJob((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('Failed to update status on server:', err);
    }
  };

  // Delete Job
  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to remove this job from your pipeline?')) return;
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    if (selectedJob?.id === jobId) {
      setSelectedJob(null);
    }
    try {
      await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete job:', err);
    }
  };

  // Update single job in state (e.g. from modal evaluation/pitch)
  const handleUpdateJob = (updated: Job) => {
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
    setSelectedJob(updated);
  };

  // Add newly imported jobs to state
  const handleJobsImported = (importedJobs: Job[]) => {
    setJobs((prev) => {
      const existingIds = new Set(prev.map((j) => j.id));
      const newItems = importedJobs.filter((j) => !existingIds.has(j.id));
      return [...newItems, ...prev];
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openSettings={() => setIsSettingsOpen(true)}
        openAddJob={() => setIsAddJobOpen(true)}
        stats={stats}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Controls Bar for Pipeline & Table */}
        {(activeTab === 'pipeline' || activeTab === 'table') && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-white dark:bg-zinc-900 p-2.5 sm:p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search roles, companies, locations, tech..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-zinc-400"
              />
            </div>

            {/* Score Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setMinScoreFilter(0)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    minScoreFilter === 0
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  All Matches
                </button>
                <button
                  onClick={() => setMinScoreFilter(80)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    minScoreFilter === 80
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>80%+ Fit</span>
                </button>
                <button
                  onClick={() => setMinScoreFilter(70)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    minScoreFilter === 70
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <span>70%+ Fit</span>
                </button>
              </div>

              <button
                onClick={() => setIsAddJobOpen(true)}
                className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-3 py-2 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Quick Add</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Views */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
            <p className="text-xs text-zinc-400 mt-2">Loading your job pipeline...</p>
          </div>
        ) : (
          <>
            {activeTab === 'pipeline' && (
              <PipelineBoard
                jobs={jobs}
                onSelectJob={(job) => setSelectedJob(job)}
                onUpdateStatus={handleUpdateStatus}
                searchFilter={searchFilter}
                minScoreFilter={minScoreFilter}
              />
            )}

            {activeTab === 'table' && (
              <JobTableView
                jobs={jobs}
                onSelectJob={(job) => setSelectedJob(job)}
                onUpdateStatus={handleUpdateStatus}
                onDeleteJob={handleDeleteJob}
                searchFilter={searchFilter}
                minScoreFilter={minScoreFilter}
              />
            )}

            {activeTab === 'harvester' && (
              <HarvesterView
                onJobsImported={handleJobsImported}
                openSettings={() => setIsSettingsOpen(true)}
              />
            )}

            {activeTab === 'profile' && <ProfileView />}
          </>
        )}
      </main>

      {/* Modals */}
      <JobDetailModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onUpdateJob={handleUpdateJob}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <AddJobModal
        isOpen={isAddJobOpen}
        onClose={() => setIsAddJobOpen(false)}
        onJobAdded={(job) => {
          handleJobsImported([job]);
          setSelectedJob(job);
        }}
      />
    </div>
  );
}
