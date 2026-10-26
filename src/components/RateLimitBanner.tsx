'use client';

import React from 'react';
import { Clock, Key, AlertTriangle, X } from 'lucide-react';
import { FormattedApiError } from '@/lib/apiErrorHandler';

interface RateLimitBannerProps {
  error: FormattedApiError | null;
  onDismiss: () => void;
  onOpenSettings: () => void;
}

export default function RateLimitBanner({
  error,
  onDismiss,
  onOpenSettings,
}: RateLimitBannerProps) {
  if (!error) return null;

  return (
    <aside
      aria-label="API quota and token status"
      className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 sm:p-5 shadow-xs mb-6 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            {error.isRateLimited ? (
              <Clock className="w-5 h-5 animate-pulse" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100">
                {error.isRateLimited
                  ? `⚡ Out of Tokens (${error.service})`
                  : `${error.service} Notice`}
              </h3>

              {error.resetTime && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                  <Clock className="w-3 h-3" />
                  Tokens Replenish at {error.resetTime}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 leading-relaxed max-w-2xl">
              {error.message}
            </p>

            <p className="text-xs text-amber-700/80 dark:text-amber-300/80 pt-0.5">
              💡 {error.suggestion}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Update Key</span>
          </button>

          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors cursor-pointer"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
