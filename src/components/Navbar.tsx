'use client';

import React from 'react';
import {
  Briefcase,
  Kanban,
  Table as TableIcon,
  Search,
  User,
  Settings,
  Plus,
  Sparkles,
  Zap,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'pipeline' | 'table' | 'harvester' | 'profile';
  setActiveTab: (tab: 'pipeline' | 'table' | 'harvester' | 'profile') => void;
  openSettings: () => void;
  openAddJob: () => void;
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
  stats,
}: NavbarProps) {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-100">
                  JobHunt<span className="text-indigo-600 dark:text-indigo-400">AI</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
                  Firecrawl + Apify
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
                AI Autonomous Job Search & Career Copilot
              </p>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="hidden lg:flex items-center gap-4 py-1.5 px-3.5 rounded-full bg-zinc-100 dark:bg-zinc-800/60 text-xs border border-zinc-200/60 dark:border-zinc-700/60">
            <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
              <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
              <span>Jobs: <strong className="text-zinc-900 dark:text-white">{stats.total}</strong></span>
            </div>
            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Avg Match: <strong className="text-zinc-900 dark:text-white">{stats.avgScore}%</strong></span>
            </div>
            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Applied: <strong className="text-zinc-900 dark:text-white">{stats.appliedCount}</strong></span>
            </div>
            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Interviews: <strong className="text-zinc-900 dark:text-white">{stats.interviewCount}</strong></span>
            </div>
          </div>

          {/* Center Tabs */}
          <nav className="flex items-center bg-zinc-100 dark:bg-zinc-800/70 p-1 rounded-xl text-sm font-medium">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'pipeline'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Kanban className="w-4 h-4 text-indigo-500" />
              <span className="hidden md:inline">Pipeline</span>
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'table'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <TableIcon className="w-4 h-4 text-blue-500" />
              <span className="hidden md:inline">List View</span>
            </button>
            <button
              onClick={() => setActiveTab('harvester')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'harvester'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Search className="w-4 h-4 text-emerald-500" />
              <span className="hidden md:inline">Harvester</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'profile'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <User className="w-4 h-4 text-purple-500" />
              <span className="hidden md:inline">Resume Profile</span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={openAddJob}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Job</span>
            </button>
            <button
              onClick={openSettings}
              title="API Keys & Settings"
              className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
