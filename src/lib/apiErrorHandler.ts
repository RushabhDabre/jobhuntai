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

export function parseApiError(error: unknown, service: 'Gemini' | 'Firecrawl' | 'Apify' | 'AI Service'): FormattedApiError {
  const err = error as { status?: number; code?: number | string; message?: string; name?: string };
  const rawMessage = (err?.message || String(error) || '').toLowerCase();
  const status = err?.status || (typeof err?.code === 'number' ? err.code : 0);

  // Check if it's 503 high demand / service unavailable
  const isHighDemand =
    status === 503 ||
    rawMessage.includes('503') ||
    rawMessage.includes('high demand') ||
    rawMessage.includes('unavailable') ||
    rawMessage.includes('spikes in demand');

  if (isHighDemand) {
    return {
      isRateLimited: false,
      isExpired: false,
      service,
      title: `${service} High Traffic Spike`,
      message: `${service} servers are currently experiencing a temporary traffic surge. Retrying with fallback model...`,
      resetTime: 'Shortly',
      resetInMinutes: 1,
      suggestion: 'Spikes usually subside within 15-30 seconds. Click retry shortly.',
      rawMessage: err?.message || '503 Service Unavailable',
    };
  }

  // Check if key is simply missing
  const isMissingKey =
    rawMessage.includes('missing') ||
    rawMessage.includes('not configured') ||
    rawMessage.includes('please connect your') ||
    rawMessage.includes('key is required');

  if (isMissingKey) {
    return {
      isRateLimited: false,
      isExpired: false,
      service,
      title: `${service} Key Required`,
      message: err?.message || `Please connect your ${service} key to use this feature.`,
      resetTime: '',
      resetInMinutes: 0,
      suggestion: 'Connect your key in the setup wizard or Settings.',
      rawMessage: err?.message || 'Key missing',
    };
  }

  // Check if it's a true rate limit or quota exhaustion (429 or RESOURCE_EXHAUSTED)
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

  const cooldownMinutes = isRateLimit ? 15 : 60;
  const resetDate = new Date(Date.now() + cooldownMinutes * 60 * 1000);
  const resetTimeStr = resetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isRateLimit) {
    return {
      isRateLimited: true,
      isExpired: false,
      service,
      title: `Rate Limit Exceeded (${service})`,
      message: `You've temporarily reached the free tier request limit for ${service}. Limits replenish every minute or after cooldown.`,
      resetTime: resetTimeStr,
      resetInMinutes: cooldownMinutes,
      suggestion: 'Wait a few moments or connect an alternative API key.',
      rawMessage: err?.message || 'Rate limit exceeded',
    };
  }

  if (isExpiredOrInvalid) {
    return {
      isRateLimited: false,
      isExpired: true,
      service,
      title: `${service} API Key Invalid or Expired`,
      message: `Your ${service} API key appears invalid or expired. Please check your key at Google AI Studio or Settings.`,
      resetTime: '',
      resetInMinutes: 0,
      suggestion: 'Update your key in Settings or the setup wizard.',
      rawMessage: err?.message || 'Invalid or expired key',
    };
  }

  // Generic error fallback
  return {
    isRateLimited: false,
    isExpired: false,
    service,
    title: `${service} Notice`,
    message: err?.message || 'A service interruption occurred. Please retry.',
    resetTime: '',
    resetInMinutes: 0,
    suggestion: 'Try again in a few moments.',
    rawMessage: err?.message || String(error),
  };
}
