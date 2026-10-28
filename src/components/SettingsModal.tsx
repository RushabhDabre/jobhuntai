'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Flame,
  Bot,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  Database,
  Cloud,
  Smartphone,
  Zap,
  Cpu,
  Layers,
  ArrowRightLeft,
} from 'lucide-react';
import { AppSettings, AiProvider } from '@/types/job';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExtendedSettings = AppSettings & {
  hasGeminiKey?: boolean;
  hasGroqKey?: boolean;
  hasOpenRouterKey?: boolean;
  hasOpenAiKey?: boolean;
  hasAnthropicKey?: boolean;
  hasGrokKey?: boolean;
  hasFirecrawlKey?: boolean;
  hasApifyToken?: boolean;
};

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<ExtendedSettings>({
    geminiApiKey: '',
    groqApiKey: '',
    openRouterApiKey: '',
    openaiApiKey: '',
    anthropicApiKey: '',
    grokApiKey: '',
    preferredAiProvider: 'gemini',
    autoFailover: true,
    firecrawlApiKey: '',
    apifyApiToken: '',
    defaultGeminiModel: 'gemini-3.8-flash',
    updatedAt: '',
  });
  const [storageInfo, setStorageInfo] = useState<{
    mode: 'cloudflare-d1' | 'supabase' | 'local';
    hasCloudflareD1: boolean;
    hasSupabase: boolean;
  }>({
    mode: 'local',
    hasCloudflareD1: false,
    hasSupabase: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/settings')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setSettings(data.settings);
          }
          if (data.storage) {
            setStorageInfo(data.storage);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        if (data.storage) {
          setStorageInfo(data.storage);
        }
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-200">
              <Key className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Settings & Multi-AI Hub
              </h2>
              <p className="text-xs text-zinc-500">
                Configure free AI engines with auto-failover, scrapers, and 24/7 cloud sync
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto">
            {/* Multi-AI Failover Strategy */}
            <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-white dark:from-indigo-950/30 dark:via-zinc-900 dark:to-zinc-900 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Multi-Model Failover & Strategy
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoFailover !== false}
                    onChange={(e) => setSettings({ ...settings, autoFailover: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Auto-Failover
                  </span>
                </label>
              </div>

              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Never hit a block! When your primary AI experiences 503 high demand or rate limit quotas (429), JobHunt AI will automatically switch to your next connected free provider (Groq, OpenRouter, Gemini) without interruption.
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-indigo-100 dark:border-indigo-900/40">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Primary AI Engine:</span>
                </label>
                <select
                  value={settings.preferredAiProvider || 'gemini'}
                  onChange={(e) =>
                    setSettings({ ...settings, preferredAiProvider: e.target.value as AiProvider })
                  }
                  className="text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 font-medium text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="gemini">Google Gemini (Recommended, 1M Context)</option>
                  <option value="groq">Groq Cloud (Free Fast Llama 3.3 70B)</option>
                  <option value="openrouter">OpenRouter (Free Tier Models)</option>
                  <option value="openai">OpenAI (ChatGPT / GPT-4o-mini)</option>
                  <option value="claude">Anthropic (Claude 3.5 Haiku)</option>
                  <option value="grok">xAI (Grok)</option>
                </select>
              </div>
            </div>

            {/* AI Provider Keys */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Connected AI Providers (Free & Paid)</span>
              </h3>

              {/* 1. Google Gemini */}
              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Google Gemini
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                      FREE TIER
                    </span>
                    {settings.hasGeminiKey ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                        Optional
                      </span>
                    )}
                  </div>

                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>Get Free Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <input
                  type="password"
                  placeholder={settings.hasGeminiKey ? '•••••••••••••••• (Leave blank to keep current)' : 'AIzaSy...'}
                  value={settings.geminiApiKey || ''}
                  onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />

                <div className="flex items-center justify-between pt-1">
                  <label className="text-xs text-zinc-500">Gemini Model:</label>
                  <select
                    value={settings.defaultGeminiModel || 'gemini-3.8-flash'}
                    onChange={(e) => setSettings({ ...settings, defaultGeminiModel: e.target.value })}
                    className="text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1"
                  >
                    <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended, 1M context)</option>
                    <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Ultra-fast failover)</option>
                    <option value="gemini-4-argon">gemini-4-argon (Deep reasoning)</option>
                  </select>
                </div>
              </div>

              {/* 2. Groq Cloud (Free Llama 3.3 70B) */}
              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Groq Cloud (Llama 3.3 70B)
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                      100% FREE & ULTRA FAST
                    </span>
                    {settings.hasGroqKey ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                        Optional
                      </span>
                    )}
                  </div>

                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>console.groq.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <input
                  type="password"
                  placeholder={settings.hasGroqKey ? '•••••••••••••••• (Leave blank to keep current)' : 'gsk_... (Free Groq key)'}
                  value={settings.groqApiKey || ''}
                  onChange={(e) => setSettings({ ...settings, groqApiKey: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
                <p className="text-[11px] text-zinc-500">
                  Zero cost, zero credit card needed. Runs Meta Llama 3.3 70B at 300+ tokens/sec — perfect when Gemini has high demand.
                </p>
              </div>

              {/* 3. OpenRouter */}
              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      OpenRouter
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                      FREE MODELS AVAILABLE
                    </span>
                    {settings.hasOpenRouterKey ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                        Optional
                      </span>
                    )}
                  </div>

                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                  >
                    <span>openrouter.ai</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <input
                  type="password"
                  placeholder={settings.hasOpenRouterKey ? '•••••••••••••••• (Leave blank to keep current)' : 'sk-or-v1-...'}
                  value={settings.openRouterApiKey || ''}
                  onChange={(e) => setSettings({ ...settings, openRouterApiKey: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
                <p className="text-[11px] text-zinc-500">
                  Routes automatically to top free models like Llama 3.3 70B Instruct Free.
                </p>
              </div>

              {/* 4. OpenAI / Claude / Grok (Collapsible/Optional) */}
              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      OpenAI (ChatGPT) / Claude / Grok
                    </span>
                    <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                      BYOK
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                      OpenAI API Key (GPT-4o-mini)
                    </label>
                    <input
                      type="password"
                      placeholder={settings.hasOpenAiKey ? '•••••••••••••••• (Leave blank to keep current)' : 'sk-...'}
                      value={settings.openaiApiKey || ''}
                      onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                      Anthropic API Key (Claude 3.5 Haiku)
                    </label>
                    <input
                      type="password"
                      placeholder={settings.hasAnthropicKey ? '•••••••••••••••• (Leave blank to keep current)' : 'sk-ant-...'}
                      value={settings.anthropicApiKey || ''}
                      onChange={(e) => setSettings({ ...settings, anthropicApiKey: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cloud Storage & 24/7 Mobile Sync Banner */}
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-linear-to-br from-indigo-50/60 via-purple-50/30 to-white dark:from-indigo-950/20 dark:via-zinc-900 dark:to-zinc-900 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    24/7 Cloud Database (Mobile & Laptop Sync)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[11px] font-semibold text-zinc-500">Active Storage:</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    storageInfo.mode === 'cloudflare-d1'
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      : storageInfo.mode === 'supabase'
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}>
                    {storageInfo.mode === 'cloudflare-d1' ? 'Cloudflare D1' : storageInfo.mode === 'supabase' ? 'Supabase' : 'Local File'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* Cloudflare D1 Status */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  storageInfo.hasCloudflareD1
                    ? 'border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/30'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                }`}>
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-amber-500" />
                    <div>
                      <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Cloudflare D1</div>
                      <div className="text-[10px] text-zinc-500">Free Edge Serverless SQLite</div>
                    </div>
                  </div>
                  {storageInfo.hasCloudflareD1 ? (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                      CONNECTED
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-400">Add to .env</span>
                  )}
                </div>

                {/* Supabase Status */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  storageInfo.hasSupabase
                    ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/30'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                }`}>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-500" />
                    <div>
                      <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Supabase</div>
                      <div className="text-[10px] text-zinc-500">Cloud PostgreSQL</div>
                    </div>
                  </div>
                  {storageInfo.hasSupabase ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                      CONNECTED
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-400">Optional</span>
                  )}
                </div>
              </div>
            </div>

            {/* Firecrawl API Key */}
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Firecrawl API Key
                  </span>
                  {settings.hasFirecrawlKey ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                      Optional
                    </span>
                  )}
                </div>

                <a
                  href="https://firecrawl.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                >
                  <span>firecrawl.dev</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <input
                type="password"
                placeholder={settings.hasFirecrawlKey ? '•••••••••••••••• (Leave blank to keep current)' : 'fc-...'}
                value={settings.firecrawlApiKey || ''}
                onChange={(e) => setSettings({ ...settings, firecrawlApiKey: e.target.value })}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
              />
              <p className="text-[11px] text-zinc-500">
                Used to scrape complex career sites into clean markdown and crawl company job boards.
              </p>
            </div>

            {/* Apify API Token */}
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Apify API Token
                  </span>
                  {settings.hasApifyToken ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                      Optional
                    </span>
                  )}
                </div>

                <a
                  href="https://console.apify.com/account/integrations"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>apify.com</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <input
                type="password"
                placeholder={settings.hasApifyToken ? '•••••••••••••••• (Leave blank to keep current)' : 'apify_api_...'}
                value={settings.apifyApiToken || ''}
                onChange={(e) => setSettings({ ...settings, apifyApiToken: e.target.value })}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <p className="text-[11px] text-zinc-500">
                Used to trigger ready-made job board scrapers for Google Jobs, LinkedIn, and Indeed.
              </p>
            </div>

            {/* Save Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : savedSuccess ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{savedSuccess ? 'Settings Saved!' : 'Save All Keys & Preferences'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
