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
  LogOut,
  LogIn,
} from 'lucide-react';
import { UserProfile } from '@/types/job';
import { UserSession } from '@/lib/auth';

interface NavbarProps {
  activeTab: 'feed' | 'pipeline' | 'profile';
  setActiveTab: (tab: 'feed' | 'pipeline' | 'profile') => void;
  openSettings: () => void;
  openAddJob: () => void;
  profile: UserProfile | null;
  userSession?: UserSession | null;
  onLogout?: () => void;
  onOpenLogin?: () => void;
  onOpenLanding?: () => void;
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
  userSession,
  onLogout,
  onOpenLogin,
  onOpenLanding,
  stats,
}: NavbarProps) {
  const userInitials = (userSession?.name || profile?.name || 'User')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Bar */}
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Product Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenLanding}
              className="flex items-center gap-3 text-left cursor-pointer group"
              title="View Roadmap & Landing Page"
            >
              <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs font-bold text-sm group-hover:scale-105 transition-transform">
                JH
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-50 tracking-tight">
                    JobHunt <span className="text-indigo-600 dark:text-indigo-400">India</span>
                  </span>
                  <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                    AI Copilot
                  </span>
                </div>
              </div>
            </button>
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
              <Search className="w-4 h-4 text-indigo-500" />
              <span>Find & Scrape Jobs ({stats.total})</span>
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
              <span>Applications & Tracker ({stats.appliedCount + stats.interviewCount})</span>
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
              <span>Resume & AI Keys</span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={openAddJob}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Job</span>
            </button>

            <button
              onClick={openSettings}
              title="API Keys & Database Status"
              className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* User Session Pill */}
            {userSession ? (
              <div className="flex items-center gap-1.5 pl-1 sm:pl-2 border-l border-zinc-200 dark:border-zinc-800">
                <div
                  title={`Logged in: ${userSession.email}`}
                  className="w-8 h-8 rounded-full bg-linear-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs cursor-default"
                >
                  {userInitials}
                </div>
                <button
                  onClick={onLogout}
                  title="Log Out / Switch Account"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          <button
            onClick={() => setActiveTab('feed')}
            className={`py-1 px-3 rounded-lg font-medium ${
              activeTab === 'feed' ? 'text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-950/60' : 'text-zinc-500'
            }`}
          >
            Find Jobs
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`py-1 px-3 rounded-lg font-medium ${
              activeTab === 'pipeline' ? 'text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-950/60' : 'text-zinc-500'
            }`}
          >
            Tracker
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-1 px-3 rounded-lg font-medium ${
              activeTab === 'profile' ? 'text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-950/60' : 'text-zinc-500'
            }`}
          >
            Profile & Keys
          </button>
        </div>
      </div>
    </header>
  );
}
