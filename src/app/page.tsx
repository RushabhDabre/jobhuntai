'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import SmartFeedView from '@/components/SmartFeedView';
import PipelineBoard from '@/components/PipelineBoard';
import HarvesterView from '@/components/HarvesterView';
import ProfileView from '@/components/ProfileView';
import JobDetailModal from '@/components/JobDetailModal';
import SettingsModal from '@/components/SettingsModal';
import AddJobModal from '@/components/AddJobModal';
import QuickStartModal from '@/components/QuickStartModal';
import LandingPage from '@/components/LandingPage';
import AuthModal from '@/components/AuthModal';
import { Job, JobStatus, UserProfile } from '@/types/job';
import { UserSession, getStoredSession, logoutUser, saveSession, checkServerSession, getAuthHeaders } from '@/lib/auth';
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
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isLandingPage, setIsLandingPage] = useState(false);

  // Fetch jobs and profile for a specific user
  const fetchData = useCallback(async (userId?: string) => {
    setLoading(true);
    const headers = getAuthHeaders();
    if (userId) {
      headers['x-user-id'] = userId;
    }

    try {
      const [jobsRes, profileRes] = await Promise.all([
        fetch(userId ? `/api/jobs?userId=${encodeURIComponent(userId)}` : '/api/jobs', { headers }),
        fetch(userId ? `/api/profile?userId=${encodeURIComponent(userId)}` : '/api/profile', { headers }),
      ]);

      const jobsData = await jobsRes.json();
      if (jobsData.success && Array.isArray(jobsData.jobs)) {
        setJobs(jobsData.jobs);
      } else {
        setJobs([]);
      }

      const profileData = await profileRes.json();
      if (profileData.success && profileData.profile) {
        setProfile(profileData.profile);
        if (!profileData.profile.resumeText && !profileData.profile.hasCompletedQuickSetup) {
          setIsQuickSetupOpen(true);
        }
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      // 1. First check server cookie session
      const serverSession = await checkServerSession();
      if (!mounted) return;

      if (serverSession) {
        setUserSession(serverSession);
        setIsLandingPage(false);
        fetchData(serverSession.id);
        return;
      }

      // 2. Check local storage session
      const localSession = getStoredSession();
      if (localSession) {
        setUserSession(localSession);
        setIsLandingPage(false);
        fetchData(localSession.id);
        return;
      }

      // 3. Unauthenticated -> show landing page
      setIsLandingPage(true);
      setLoading(false);
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, [fetchData]);

  // Handle Login or Sign Up Success
  const handleAuthSuccess = (session: UserSession) => {
    setUserSession(session);
    saveSession(session);
    setJobs([]);
    setProfile(null);
    setIsLandingPage(false);
    setIsAuthOpen(false);
    fetchData(session.id);
  };

  // Handle Log Out
  const handleLogout = async () => {
    await logoutUser();
    setUserSession(null);
    setJobs([]);
    setProfile(null);
    setIsLandingPage(true);
  };

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
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
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
      await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
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
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
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

  // Harvest live openings matching candidate's chosen profile keywords
  const handleHarvestForProfile = async (targetRoles?: string[], preferredLocations?: string[]) => {
    setActiveTab('feed');
    const roles = targetRoles && targetRoles.length > 0 ? targetRoles : profile?.targetTitles || [];
    if (roles.length === 0) return;

    const primaryRole = roles[0];
    let totalImported = 0;

    const presets = [
      { slug: 'razorpay', platform: 'greenhouse' as const },
      { slug: 'browserstack', platform: 'ashby' as const },
      { slug: 'swiggy', platform: 'lever' as const },
      { slug: 'cred', platform: 'greenhouse' as const },
    ];

    for (const preset of presets) {
      try {
        const res = await fetch('/api/harvest/ats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            platform: preset.platform,
            companySlug: preset.slug,
            keywordFilter: primaryRole,
            limit: 4,
            autoScore: true,
          }),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.jobs) && data.jobs.length > 0) {
          handleJobsImported(data.jobs);
          totalImported += data.jobs.length;
        }
      } catch (e) {
        console.warn(`Initial harvest error for ${preset.slug}:`, e);
      }
    }

    // If niche domain had 0 live results on startup boards (e.g. SAP ERP, QA, Mobile), generate domain-matched openings
    if (totalImported === 0) {
      try {
        const res = await fetch('/api/harvest/quick-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            targetTitles: roles,
            preferredLocations: preferredLocations || profile?.preferredLocations,
            preferredTechnologies: profile?.preferredTechnologies,
            domainCategory: profile?.domainCategory,
          }),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.jobs) && data.jobs.length > 0) {
          handleJobsImported(data.jobs);
        }
      } catch (e) {
        console.warn('Quick-match fallback failed:', e);
      }
    }
  };

  // If user is not logged in or chose to view landing page, render LandingPage
  if (isLandingPage) {
    return (
      <>
        <LandingPage
          onEnterApp={handleAuthSuccess}
          onOpenSignIn={() => {
            setAuthMode('signin');
            setIsAuthOpen(true);
          }}
          onOpenSignUp={() => {
            setAuthMode('signup');
            setIsAuthOpen(true);
          }}
        />
        <AuthModal
          isOpen={isAuthOpen}
          initialMode={authMode}
          onClose={() => setIsAuthOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openSettings={() => setIsSettingsOpen(true)}
        openAddJob={() => setIsAddJobOpen(true)}
        profile={profile}
        userSession={userSession}
        onLogout={handleLogout}
        onOpenLogin={() => {
          setAuthMode('signin');
          setIsAuthOpen(true);
        }}
        onOpenLanding={() => setIsLandingPage(true)}
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
                onHarvestMatching={() => handleHarvestForProfile()}
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
        onTriggerSearch={handleHarvestForProfile}
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

      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
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
