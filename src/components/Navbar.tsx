'use client';

import React from 'react';
import {
  Sparkles,
  LayoutGrid,
  Kanban,
  Search,
  User,
  Settings,
  Plus,
  IndianRupee,
  MapPin,
  Clock,
} from 'lucide-react';
import { UserProfile } from '@/types/job';

interface NavbarProps {
  activeTab: 'feed' | 'pipeline' | 'harvester' | 'profile';
  setActiveTab: (tab: 'feed' | 'pipeline' | 'harvester' | 'profile') => void;
  openSettings: () => void;
  openAddJob: () => void;
  profile: UserProfile | null;
  stats: {
    total: number;
    avgScore: number;
    appliedCount: number;
    interviewCount: number;
  };
}

export default function Navbar({
  activeTab,
  setActiveTab,
  openSettings,
  openAddJob,
  profile,
  stats,
}: NavbarProps) {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Bar */}
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Product Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs font-bold text-sm">
              JH
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-50 tracking-tight">
                  JobHunt <span className="text-indigo-600 dark:text-indigo-400">India</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                  AI Career Copilot
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-zinc-100/80 dark:bg-zinc-800/60 p-1 rounded-xl text-xs sm:text-sm font-medium">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'feed'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4 text-indigo-500" />
              <span>Matched Roles ({stats.total})</span>
            </button>

            <button
              onClick={() => setActiveTab('pipeline')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'pipeline'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Kanban className="w-4 h-4 text-blue-500" />
              <span>Pipeline ({stats.appliedCount + stats.interviewCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('harvester')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'harvester'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Search className="w-4 h-4 text-emerald-500" />
              <span>Harvester</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <User className="w-4 h-4 text-purple-500" />
              <span>Resume & Preferences</span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={openAddJob}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Job</span>
            </button>

            <button
              onClick={openSettings}
              title="API Keys & Model Settings"
              className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          <button
            onClick={() => setActiveTab('feed')}
            className={`py-1 px-2 rounded-lg font-medium ${
              activeTab === 'feed' ? 'text-indigo-600 font-bold' : 'text-zinc-500'
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`py-1 px-2 rounded-lg font-medium ${
              activeTab === 'pipeline' ? 'text-indigo-600 font-bold' : 'text-zinc-500'
            }`}
          >
            Pipeline
          </button>
          <button
            onClick={() => setActiveTab('harvester')}
            className={`py-1 px-2 rounded-lg font-medium ${
              activeTab === 'harvester' ? 'text-indigo-600 font-bold' : 'text-zinc-500'
            }`}
          >
            Harvester
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-1 px-2 rounded-lg font-medium ${
              activeTab === 'profile' ? 'text-indigo-600 font-bold' : 'text-zinc-500'
            }`}
          >
            Profile
          </button>
        </div>

        {/* Context Strip: User Indian Search Criteria */}
        {profile && (
          <div className="hidden lg:flex items-center justify-between py-2 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">{profile.name}</strong> ({profile.yearsOfExperience} yrs exp)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                <span>Locations: <strong className="text-zinc-700 dark:text-zinc-300 font-medium">{profile.preferredLocations?.slice(0, 3).join(', ')}</strong></span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Notice: <strong className="text-zinc-700 dark:text-zinc-300 font-medium">{profile.noticePeriod || '30 Days'}</strong></span>
              </span>
              {profile.expectedCtc && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Target: <strong className="text-emerald-600 dark:text-emerald-400 font-medium">{profile.expectedCtc}</strong></span>
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                <Sparkles className="w-3 h-3" />
                Avg Match: {stats.avgScore}%
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
