'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Rocket,
  ArrowRight,
  ShieldCheck,
  Search,
  CheckCircle2,
  ExternalLink,
  Bot,
  Flame,
  Key,
  MapPin,
  Clock,
  Briefcase,
  FileText,
  Send,
  Database,
  Smartphone,
  ChevronRight,
  Star,
  Zap,
} from 'lucide-react';
import { UserSession, saveSession } from '@/lib/auth';

interface LandingPageProps {
  onEnterApp: (session: UserSession) => void;
  onOpenLogin: () => void;
}

export default function LandingPage({ onEnterApp, onOpenLogin }: LandingPageProps) {
  // Quick onboarding form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [targetTitle, setTargetTitle] = useState('Software Developer');
  const [targetLocation, setTargetLocation] = useState('Pune');
  const [submitting, setSubmitting] = useState(false);
  const [activeRoadmapStep, setActiveRoadmapStep] = useState(0);

  const roadmapSteps = [
    {
      step: '01',
      title: 'Connect AI & India Criteria',
      badge: 'Zero Monthly Cost',
      tagline: 'Bring your free Google Gemini API key and set your Indian market filters.',
      description:
        'Specify your target cities (Pune, Mumbai, Hyderabad, Bengaluru), notice period (Immediate to 30 Days), and CTC in ₹ LPA. No subscription required — you use your own free Google Gemini API quota.',
      icon: Key,
      color: 'indigo',
      preview: {
        title: 'Instant AI Configuration',
        points: [
          'Direct Google Gemini 2.5 Flash integration',
          'Notice Period filter (Immediate Joiner / 15 / 30 / 60 / 90 Days)',
          'CTC expectations calibrated in ₹ Lakhs Per Annum',
        ],
      },
    },
    {
      step: '02',
      title: 'Resume Intelligence Extraction',
      badge: 'Multimodal AI',
      tagline: 'Upload your PDF resume once. The AI extracts skills, tech stack, and background.',
      description:
        'Instead of manual data entry, Gemini analyzes your resume layout, parses your projects, tech stack (React, Java, C#, .NET, Python), and automatically builds your master candidate benchmark.',
      icon: FileText,
      color: 'purple',
      preview: {
        title: 'ATS Resume Parser',
        points: [
          'Drag & drop standard PDF resumes',
          'Automated skill extraction & experience calculation',
          'Generates clean markdown candidate benchmark',
        ],
      },
    },
    {
      step: '03',
      title: '48-Hour Fresh Vacancy Harvester',
      badge: 'Live Working Links Only',
      tagline: 'Sweeps direct company ATS portals and aggregators for newly published openings.',
      description:
        'Tired of expired postings? JobHunt AI prioritizes vacancies added within the last 48 hours from Greenhouse, Lever, Ashby, LinkedIn India, and Google Jobs with guaranteed verified live links.',
      icon: Search,
      color: 'emerald',
      preview: {
        title: 'Zero Dummy Jobs Guarantee',
        points: [
          '⚡ Freshness Filter: 48 Hours default (extendable to 7, 10, 30 days)',
          'Public ATS harvesters (Razorpay, Swiggy, BrowserStack, Atlassian)',
          'Auto-generates verified live search URLs (No 404 dead links)',
        ],
      },
    },
    {
      step: '04',
      title: 'AI Fit Scoring & 1-Click Outreach',
      badge: 'Land Real Interviews',
      tagline: 'Evaluates your resume fit (0-100%) and drafts personalized recruiter DMs.',
      description:
        'Get clear recommendations (Strong Fit, Good Match), highlighted strengths, potential interview skill gap questions, and one-click tailored LinkedIn recruiter notes & cold emails.',
      icon: Send,
      color: 'amber',
      preview: {
        title: 'Recruiter Copilot',
        points: [
          'Detailed fit explanation against exact requirements',
          'Interview talking points & project highlights',
          '1-Click LinkedIn DMs & hiring manager outreach',
        ],
      },
    },
  ];

  const handleQuickLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || email.split('@')[0],
          geminiApiKey: geminiApiKey.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Also save preferred title and location
        await fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': data.user.id,
          },
          body: JSON.stringify({
            name: name.trim() || data.user.name,
            email: data.user.email,
            targetTitles: [targetTitle],
            preferredLocations: [targetLocation],
            geminiApiKey: geminiApiKey.trim() || undefined,
          }),
        });

        const session: UserSession = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          geminiApiKey: geminiApiKey.trim() || undefined,
          createdAt: new Date().toISOString(),
        };

        saveSession(session);
        onEnterApp(session);
      }
    } catch (err) {
      console.error('Launch failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col overflow-x-hidden">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-500/20 text-sm">
              JH
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">
                JobHunt <span className="text-indigo-400">India</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-zinc-900 text-indigo-400 border border-indigo-500/20">
                AI Career Copilot
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#roadmap"
              className="hidden md:inline-flex text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Interactive Roadmap
            </a>
            <button
              onClick={onOpenLogin}
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <a
              href="#connect"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <span>Connect AI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-indigo-500/30 text-indigo-300 text-xs font-medium shadow-inner">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>⚡ Fresh 48-Hour Vacancy Scanner • Pune • Mumbai • Hyderabad • Remote</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Stop Searching Manually. <br />
            Let <span className="bg-clip-text text-transparent bg-linear-to-r from-indigo-400 via-purple-300 to-pink-400">Autonomous AI</span> Land Your Tech Job.
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Connect your free Google Gemini key, upload your resume, and get active Indian tech vacancies scored against your background — complete with custom recruiter pitches and 24/7 mobile sync.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 max-w-3xl mx-auto text-left">
            <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800">
              <div className="text-xl font-bold text-white">⚡ 48 Hours</div>
              <div className="text-[11px] text-zinc-400">Fresh Vacancy Filter</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800">
              <div className="text-xl font-bold text-emerald-400">₹0 / Month</div>
              <div className="text-[11px] text-zinc-400">Free Gemini API</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800">
              <div className="text-xl font-bold text-indigo-400">100% Live</div>
              <div className="text-[11px] text-zinc-400">Zero 404 Links</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800">
              <div className="text-xl font-bold text-purple-400">24/7 Cloud</div>
              <div className="text-[11px] text-zinc-400">Mobile & Laptop Sync</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Roadmap Section */}
      <section id="roadmap" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-zinc-900">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-widest">
            <Rocket className="w-3.5 h-3.5" />
            <span>Interactive Roadmap</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            The 4-Step Autonomous Job Hunt Engine
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Click on each milestone below to discover how JobHunt AI automates your search from resume to offer letter.
          </p>
        </div>

        {/* Milestone Navigation Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {roadmapSteps.map((s, idx) => {
            const Icon = s.icon;
            const isActive = activeRoadmapStep === idx;
            return (
              <button
                key={s.step}
                onClick={() => setActiveRoadmapStep(idx)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-zinc-900 border-indigo-500/80 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
                    : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {s.step}
                  </span>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
                </div>
                <div className={`text-sm font-bold ${isActive ? 'text-white' : 'text-zinc-300'}`}>
                  {s.title}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">{s.badge}</div>
              </button>
            );
          })}
        </div>

        {/* Active Milestone Deep Dive Card */}
        {(() => {
          const current = roadmapSteps[activeRoadmapStep];
          const CurrentIcon = current.icon;
          return (
            <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-b from-zinc-900 to-zinc-950 border border-zinc-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-xl">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 text-xs font-bold">
                  <CurrentIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Milestone {current.step}: {current.badge}</span>
                </div>
                <h3 className="text-xl sm:text-3xl font-extrabold text-white">
                  {current.title}
                </h3>
                <p className="text-sm sm:text-base font-medium text-zinc-300">
                  {current.tagline}
                </p>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  {current.description}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <a
                    href="#connect"
                    className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                  >
                    <span>Connect & Start This Step</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                  {activeRoadmapStep < roadmapSteps.length - 1 && (
                    <button
                      onClick={() => setActiveRoadmapStep((prev) => prev + 1)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-900 transition-colors"
                    >
                      <span>Next Milestone</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5 p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    {current.preview.title}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                    Active Feature
                  </span>
                </div>
                <div className="space-y-2.5 pt-1">
                  {current.preview.points.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* Connect & Launch Workspace Section */}
      <section id="connect" className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="p-6 sm:p-10 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Connect Your API Keys & Open Workspace
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Each user gets a private workspace. Your API key and resume stay completely confidential.
            </p>
          </div>

          <form onSubmit={handleQuickLaunch} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rushabh Dabare"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Your Email Address (Account ID)
                </label>
                <input
                  type="email"
                  required
                  placeholder="rushabhdabare2001@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Google Gemini API Key
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>Get 100% Free API Key at Google AI Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                placeholder="AIzaSy... (Connects directly to Gemini 2.5 Flash)"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white font-mono"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Zero billing needed. Google AI Studio gives free tier access for Gemini models.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Primary Role Preference
                </label>
                <select
                  value={targetTitle}
                  onChange={(e) => setTargetTitle(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                >
                  <option value="Software Developer">Software Developer</option>
                  <option value="React Developer">React Developer</option>
                  <option value="Fullstack Developer">Fullstack Developer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer (Java / C#)">Backend Developer (Java / C#)</option>
                  <option value="Python Developer">Python Developer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Preferred Location
                </label>
                <select
                  value={targetLocation}
                  onChange={(e) => setTargetLocation(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                >
                  <option value="Pune">Pune</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Remote (India)">Remote (India)</option>
                </select>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{submitting ? 'Setting Up Your Workspace...' : 'Launch My Job Hunt Copilot 🚀'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-900 py-8 px-4 text-center text-xs text-zinc-500">
        <p>JobHunt AI — India Tech Edition • Built with Next.js, React 19, Google Gemini & Cloudflare D1</p>
      </footer>
    </div>
  );
}
