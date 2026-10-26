'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import SmartFeedView from '@/components/SmartFeedView';
import PipelineBoard from '@/components/PipelineBoard';
import HarvesterView from '@/components/HarvesterView';
import ProfileView from '@/components/ProfileView';
import JobDetailModal from '@/components/JobDetailModal';
import SettingsModal from '@/components/SettingsModal';
import AddJobModal from '@/components/AddJobModal';
import { Job, JobStatus, UserProfile } from '@/types/job';
import { Search, Sparkles, Plus, Loader2 } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'feed' | 'pipeline' | 'harvester' | 'profile'>('feed');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);

  // Fetch jobs and profile on mount
  const fetchData = async () => {
    try {
      const [jobsRes, profileRes] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/profile'),
      ]);

      const jobsData = await jobsRes.json();
      if (jobsData.success && Array.isArray(jobsData.jobs)) {
        setJobs(jobsData.jobs);
      }

      const profileData = await profileRes.json();
      if (profileData.success && profileData.profile) {
        setProfile(profileData.profile);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
    <div className="min-h-screen bg-zinc-50/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openSettings={() => setIsSettingsOpen(true)}
        openAddJob={() => setIsAddJobOpen(true)}
        profile={profile}
        stats={stats}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Search & Filter Controls (Visible on Feed & Pipeline) */}
        {(activeTab === 'feed' || activeTab === 'pipeline') && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search roles (e.g. SDE 2, Frontend), companies (Razorpay, Swiggy), or Indian cities..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-zinc-400"
              />
            </div>

            {/* Score Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setMinScoreFilter(0)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    minScoreFilter === 0
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-bold'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  All Roles
                </button>
                <button
                  onClick={() => setMinScoreFilter(90)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    minScoreFilter === 90
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>90%+ Fit</span>
                </button>
                <button
                  onClick={() => setMinScoreFilter(75)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    minScoreFilter === 75
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  <span>75%+ Fit</span>
                </button>
              </div>

              <button
                onClick={() => setIsAddJobOpen(true)}
                className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Role</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Views */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
            <p className="text-xs text-zinc-400 mt-2">Loading your job pipeline...</p>
          </div>
        ) : (
          <>
            {activeTab === 'feed' && (
              <SmartFeedView
                jobs={jobs}
                onSelectJob={(job) => setSelectedJob(job)}
                onUpdateStatus={handleUpdateStatus}
                onDeleteJob={handleDeleteJob}
                searchFilter={searchFilter}
                minScoreFilter={minScoreFilter}
              />
            )}

            {activeTab === 'pipeline' && (
              <PipelineBoard
                jobs={jobs}
                onSelectJob={(job) => setSelectedJob(job)}
                onUpdateStatus={handleUpdateStatus}
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
