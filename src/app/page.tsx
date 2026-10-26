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
import QuickStartModal from '@/components/QuickStartModal';
import { Job, JobStatus, UserProfile } from '@/types/job';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'feed' | 'pipeline' | 'harvester' | 'profile'>('feed');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [isQuickSetupOpen, setIsQuickSetupOpen] = useState(false);

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
        // If user has not completed quick setup, open modal automatically
        if (!profileData.profile.hasCompletedQuickSetup) {
          setIsQuickSetupOpen(true);
        }
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

  // Save partial profile updates from QuickStart modal
  const handleSaveProfile = async (partialProfile: Partial<UserProfile>) => {
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partialProfile),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error('Failed to save profile from quick setup:', err);
    }
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
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
            <p className="text-xs text-zinc-400 mt-2">Loading active vacancies...</p>
          </div>
        ) : (
          <>
            {activeTab === 'feed' && (
              <SmartFeedView
                jobs={jobs}
                profile={profile}
                onSelectJob={(job) => setSelectedJob(job)}
                onUpdateStatus={handleUpdateStatus}
                onDeleteJob={handleDeleteJob}
                onOpenQuickSetup={() => setIsQuickSetupOpen(true)}
              />
            )}

            {activeTab === 'pipeline' && (
              <PipelineBoard
                jobs={jobs}
                onSelectJob={(job) => setSelectedJob(job)}
                onUpdateStatus={handleUpdateStatus}
                searchFilter=""
                minScoreFilter={0}
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
      <QuickStartModal
        isOpen={isQuickSetupOpen}
        onClose={() => setIsQuickSetupOpen(false)}
        profile={profile}
        onSaveProfile={handleSaveProfile}
        onTriggerSearch={() => setActiveTab('feed')}
      />

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
