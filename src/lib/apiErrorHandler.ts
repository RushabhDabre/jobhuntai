export interface FormattedApiError {
  isRateLimited: boolean;
  isExpired: boolean;
  service: 'Gemini' | 'Firecrawl' | 'Apify' | 'AI Service';
  title: string;
  message: string;
  resetTime: string; // e.g. "12:25 AM"
  resetInMinutes: number;
  suggestion: string;
  rawMessage: string;
}

export function parseApiError(error: unknown, service: 'Gemini' | 'Firecrawl' | 'Apify'): FormattedApiError {
  const err = error as { status?: number; code?: number | string; message?: string; name?: string };
  const rawMessage = (err?.message || String(error) || '').toLowerCase();
  const status = err?.status || (typeof err?.code === 'number' ? err.code : 0);

  // Check if it's a rate limit or quota exhaustion (429 or RESOURCE_EXHAUSTED)
  const isRateLimit =
    status === 429 ||
    rawMessage.includes('resource_exhausted') ||
    rawMessage.includes('rate limit') ||
    rawMessage.includes('too many requests') ||
    rawMessage.includes('quota exceeded') ||
    rawMessage.includes('tokens per minute') ||
    rawMessage.includes('requests per minute') ||
    rawMessage.includes('credits') ||
    rawMessage.includes('insufficient_quota');

  // Check if it's an expired or invalid API key
  const isExpiredOrInvalid =
    status === 401 ||
    status === 403 ||
    rawMessage.includes('api_key_invalid') ||
    rawMessage.includes('key expired') ||
    rawMessage.includes('invalid api key') ||
    rawMessage.includes('unauthorized') ||
    rawMessage.includes('permission_denied') ||
    rawMessage.includes('forbidden');

  // Compute a smart reset time (typically 15 minutes for RPM/TPM bursts or next hour)
  const cooldownMinutes = isRateLimit ? 15 : 60;
  const resetDate = new Date(Date.now() + cooldownMinutes * 60 * 1000);
  const resetTimeStr = resetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isRateLimit) {
    return {
      isRateLimited: true,
      isExpired: false,
      service,
      title: `Out of Tokens (${service})`,
      message: `You've temporarily exhausted your free tier tokens for ${service}. Please wait until ${resetTimeStr} (${cooldownMinutes} mins) for token replenishment.`,
      resetTime: resetTimeStr,
      resetInMinutes: cooldownMinutes,
      suggestion: 'You can wait for the cooldown or enter an alternative API key in Settings.',
      rawMessage: err?.message || 'Rate limit exceeded',
    };
  }

  if (isExpiredOrInvalid) {
    return {
      isRateLimited: false,
      isExpired: true,
      service,
      title: `${service} API Key Expired or Invalid`,
      message: `Your ${service} API key is expired or unauthorized. Please update it in Settings.`,
      resetTime: resetTimeStr,
      resetInMinutes: cooldownMinutes,
      suggestion: 'Click the Settings (⚙️) icon in the top right to configure a fresh key.',
      rawMessage: err?.message || 'Invalid or expired key',
    };
  }

  // Generic error fallback with friendly time estimate
  return {
    isRateLimited: false,
    isExpired: false,
    service,
    title: `${service} Temporary Hiccup`,
    message: err?.message || 'A temporary service interruption occurred. Please retry shortly.',
    resetTime: resetTimeStr,
    resetInMinutes: 5,
    suggestion: 'Try again in a few moments.',
    rawMessage: err?.message || String(error),
  };
}
