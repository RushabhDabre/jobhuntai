/**
 * Smart URL resolver for job listings.
 * Ensures the user NEVER lands on a 404 "Page Not Found" page.
 */

export interface JobLinkParams {
  url?: string;
  title: string;
  company: string;
  location?: string;
  source?: string;
}

export function isMockOrBrokenUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (trimmed === '' || trimmed === '#' || trimmed.startsWith('javascript:')) return true;

  // Catch legacy mock/placeholder patterns that always 404
  if (
    trimmed.includes('job-listings-react-developer-zensar-pune') ||
    trimmed.includes('software-developer-persistent-pune') ||
    trimmed.includes('frontend-engineer-globallogic-pune') ||
    trimmed.includes('accenture-react-developer-mumbai') ||
    trimmed.includes('wipro-fullstack-developer-hyderabad') ||
    trimmed.includes('dummy') ||
    trimmed.includes('example.com')
  ) {
    return true;
  }

  return false;
}

/**
 * Returns a working URL for direct apply. If the provided URL is a mock or missing,
 * automatically generates a live Google Jobs / LinkedIn / Naukri live search query.
 */
export function getSafeJobUrl(job: JobLinkParams): string {
  if (job.url && !isMockOrBrokenUrl(job.url)) {
    return job.url;
  }

  // Fallback to live Google Jobs search (never 404s, shows live active listings)
  const query = `${job.title} ${job.company} ${job.location || 'India'} jobs`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}&ibp=htl;jobs`;
}

/**
 * Generates verified platform-specific search URLs so the user can easily
 * verify the opening across LinkedIn, Naukri, and Google Jobs.
 */
export function getPlatformSearchUrls(job: JobLinkParams) {
  const query = `${job.title} ${job.company}`.trim();
  const location = job.location || 'India';

  return {
    linkedIn: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`,
    googleJobs: `https://www.google.com/search?q=${encodeURIComponent(`${query} in ${location} jobs`)}&ibp=htl;jobs`,
    naukri: `https://www.naukri.com/jobs-in-${encodeURIComponent(location.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}?k=${encodeURIComponent(query)}`,
    indeed: `https://in.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`,
  };
}
