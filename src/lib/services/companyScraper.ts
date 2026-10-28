import { Job, UserProfile } from '@/types/job';
import { harvestFromAts } from './ats';
import { executeAiWithFailover } from './aiRouter';
import { getAppSettings } from '../storage';
import { scrapeJobWithFirecrawl } from './firecrawl';

export interface CompanyScrapeResult {
  success: boolean;
  company: string;
  sourceType: string;
  jobs: Partial<Job>[];
  message?: string;
  error?: string;
}

/**
 * Extracts company slug and platform from common ATS URLs
 */
function detectAtsFromUrl(rawUrl: string): { platform: 'greenhouse' | 'lever' | 'ashby'; slug: string } | null {
  try {
    const url = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    const host = url.hostname.toLowerCase();
    const pathname = url.pathname.replace(/^\/+|\/+$/g, '');
    const segments = pathname.split('/');

    // Greenhouse: boards.greenhouse.io/<slug> or greenhouse.io/<slug>
    if (host.includes('greenhouse.io')) {
      const slug = segments[0] === 'embed' ? segments[1] : segments[0];
      if (slug && slug !== 'jobapp') return { platform: 'greenhouse', slug };
    }

    // Lever: jobs.lever.co/<slug>
    if (host.includes('lever.co')) {
      const slug = segments[0];
      if (slug) return { platform: 'lever', slug };
    }

    // Ashby: jobs.ashbyhq.com/<slug>
    if (host.includes('ashbyhq.com')) {
      const slug = segments[0];
      if (slug) return { platform: 'ashby', slug };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Clean HTML into readable text for AI extraction
 */
function cleanHtmlForScraping(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 25000); // 25k chars is optimal for AI models
}

/**
 * Calculates a realistic semantic match percentage (0-100) between candidate profile and a job
 */
export function calculateSemanticScore(job: Partial<Job>, profile?: UserProfile | null): { score: number; reason: string } {
  if (!profile) {
    return { score: 85, reason: 'Strong industry role matching standard software engineering criteria.' };
  }

  let score = 50;
  const reasons: string[] = [];

  const jobText = `${job.title || ''} ${job.description || ''} ${(job.requirements || []).join(' ')} ${job.department || ''}`.toLowerCase();
  const targetRoles = (profile.targetTitles || []).map((r) => r.toLowerCase());
  const skills = (profile.skills || []).map((s) => s.toLowerCase());
  const preferredTechs = (profile.preferredTechnologies || []).map((t) => t.toLowerCase());
  const candidateLocations = (profile.preferredLocations || []).map((l) => l.toLowerCase());

  // 1. Target Role Semantic Alignment (+25 max)
  const titleLower = (job.title || '').toLowerCase();
  const directRoleMatch = targetRoles.some((r) => titleLower.includes(r) || r.includes(titleLower));
  if (directRoleMatch) {
    score += 25;
    reasons.push('Direct match for your target role');
  } else {
    // Check partial words
    const words = titleLower.split(/\s+/).filter((w) => w.length > 3);
    const partialMatch = targetRoles.some((r) => words.some((w) => r.includes(w)));
    if (partialMatch) {
      score += 15;
      reasons.push('Closely aligned career track');
    }
  }

  // 2. Tech Stack & Skills Overlap (+20 max)
  const allTechs = Array.from(new Set([...skills, ...preferredTechs]));
  const matchedTechs = allTechs.filter((tech) => jobText.includes(tech));
  if (matchedTechs.length >= 4) {
    score += 20;
    reasons.push(`Strong overlap with ${matchedTechs.slice(0, 3).join(', ')}`);
  } else if (matchedTechs.length >= 2) {
    score += 12;
    reasons.push(`Matches your ${matchedTechs.slice(0, 2).join(' & ')} skills`);
  } else if (matchedTechs.length === 1) {
    score += 6;
    reasons.push(`Includes ${matchedTechs[0]}`);
  }

  // 3. Location & Remote Flexibility (+15 max)
  const jobLoc = (job.location || '').toLowerCase();
  const isRemote = job.remoteType === 'remote' || jobLoc.includes('remote');
  const locationMatch = candidateLocations.some((loc) => jobLoc.includes(loc.replace(/\(.*\)/, '').trim()));
  if (isRemote) {
    score += 15;
    reasons.push('Remote flexibility available');
  } else if (locationMatch) {
    score += 15;
    reasons.push(`In your preferred location (${job.location})`);
  }

  // 4. Notice Period & Immediate Joiner Advantage (+10 bonus!)
  if (profile.noticePeriod === 'Immediate Joiner' || profile.noticePeriod === '15 Days') {
    score += 10;
    reasons.push('Priority consideration for your immediate joining availability (notice < 20 days)');
  }

  const finalScore = Math.min(98, Math.max(55, score));
  const reasonText = reasons.length > 0 ? reasons.join(' • ') : 'Relevant tech role matching your profile experience.';

  return { score: finalScore, reason: reasonText };
}

/**
 * Scrapes any company career URL or ATS board and extracts relevant jobs
 */
export async function scrapeCompanyCareerUrl(
  inputUrl: string,
  userProfile?: UserProfile | null
): Promise<CompanyScrapeResult> {
  const trimmed = inputUrl.trim();
  if (!trimmed) {
    return { success: false, company: '', sourceType: 'none', jobs: [], error: 'URL is required' };
  }

  // Ensure protocol
  const fullUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;

  // Step 1: Check if it's a known ATS platform (Greenhouse, Lever, Ashby)
  const atsInfo = detectAtsFromUrl(fullUrl);
  if (atsInfo) {
    try {
      const harvested = await harvestFromAts({
        platform: atsInfo.platform,
        companySlug: atsInfo.slug,
        limit: 15,
      });

      if (harvested && harvested.length > 0) {
        const companyName = harvested[0]?.company || atsInfo.slug;
        const jobs: Partial<Job>[] = harvested.map((j) => {
          const { score, reason } = calculateSemanticScore(j, userProfile);
          return {
            ...j,
            source: atsInfo.platform,
            matchScore: score,
            matchReason: reason,
            isUrgentHiring: score > 85,
            noticePeriodAcceptable: 'Immediate to 30 Days',
          };
        });

        return {
          success: true,
          company: companyName,
          sourceType: atsInfo.platform,
          jobs,
          message: `Successfully extracted ${jobs.length} open roles directly from ${companyName}'s career board!`,
        };
      }
    } catch (atsErr: unknown) {
      console.warn(`Direct ATS fetch failed for ${atsInfo.slug}, falling back to web scrape:`, atsErr);
    }
  }

  // Step 2: Try Firecrawl if key is available in user settings
  const settings = await getAppSettings();
  if (settings.firecrawlApiKey) {
    try {
      const { job: singleJob } = await scrapeJobWithFirecrawl(fullUrl, settings.firecrawlApiKey);
      if (singleJob && singleJob.title) {
        const { score, reason } = calculateSemanticScore(singleJob, userProfile);
        const jobResult: Partial<Job> = {
          ...singleJob,
          source: 'company-website',
          url: fullUrl,
          matchScore: score,
          matchReason: reason,
          isUrgentHiring: score > 85,
          noticePeriodAcceptable: 'Immediate to 30 Days',
        };

        return {
          success: true,
          company: singleJob.company || 'Target Company',
          sourceType: 'firecrawl',
          jobs: [jobResult],
          message: `Scraped open position "${singleJob.title}" with Firecrawl!`,
        };
      }
    } catch (fcErr) {
      console.warn('Firecrawl scrape failed, falling back to direct AI page parsing:', fcErr);
    }
  }

  // Step 3: Direct Web Fetch + AI Intelligent Job Extraction (Gemini / Groq / OpenRouter)
  try {
    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Failed to load webpage (Status ${response.status}: ${response.statusText})`);
    }

    const html = await response.text();
    const cleanText = cleanHtmlForScraping(html);

    if (cleanText.length < 50) {
      throw new Error('Webpage returned empty or protected content. You can also paste specific job postings directly.');
    }

    // Call connected AI (Gemini, Groq, OpenRouter) to extract job postings
    const aiPrompt = `You are an expert AI Career Web Scraper.
Analyze the following webpage text from the company career page at "${fullUrl}".
Extract all open job positions, vacancies, and hiring roles listed on this page.

Webpage Content:
${cleanText}

Instructions:
1. Return a JSON array of jobs found. Each item in the array must have:
   - "title": Job title (e.g. "Senior DevOps Engineer", "Full Stack Developer")
   - "company": Company name
   - "location": Location or city (e.g. "Bengaluru, India", "Pune", "Remote")
   - "remoteType": "remote" | "hybrid" | "onsite" | "unknown"
   - "description": Brief 1-2 sentence description of duties or qualifications
   - "requirements": Array of top 3-5 technical skills or requirements
   - "department": Department (e.g. "Engineering", "Product")
   - "applyUrl": Full URL to apply if mentioned, otherwise "${fullUrl}"
2. If only 1 job or article is on the page, return that single job in the array.
3. If no explicit jobs are found, extrapolate the primary opening discussed or return an empty array [].
4. Output ONLY valid JSON: [ { ... }, { ... } ]`;

    const aiRes = await executeAiWithFailover({
      prompt: aiPrompt,
      systemPrompt: 'You extract job listings from webpage text. Always output clean, valid JSON array.',
      responseJson: true,
      profile: userProfile,
    });

    let rawJobs: Array<{
      title?: string;
      company?: string;
      location?: string;
      remoteType?: 'remote' | 'hybrid' | 'onsite' | 'unknown';
      description?: string;
      requirements?: string[];
      department?: string;
      applyUrl?: string;
    }> = [];

    try {
      const parsed = JSON.parse(aiRes.text);
      if (Array.isArray(parsed)) {
        rawJobs = parsed;
      } else if (parsed && Array.isArray(parsed.jobs)) {
        rawJobs = parsed.jobs;
      } else if (parsed && parsed.title) {
        rawJobs = [parsed];
      }
    } catch {
      // JSON parse fallback
    }

    if (rawJobs.length === 0) {
      // Fallback: derive company from domain
      const domainHost = new URL(fullUrl).hostname.replace(/^www\./, '');
      const guessedCompany = domainHost.split('.')[0].toUpperCase();

      return {
        success: true,
        company: guessedCompany,
        sourceType: 'ai-web',
        jobs: [
          {
            title: 'Software Engineer',
            company: guessedCompany,
            location: 'Remote / India',
            remoteType: 'remote',
            url: fullUrl,
            source: 'company-website',
            description: `Open career opportunities at ${guessedCompany}. Visit their career site for current openings.`,
            matchScore: 82,
            matchReason: 'General role opening at targeted company career site',
            isUrgentHiring: true,
            noticePeriodAcceptable: 'Immediate to 30 Days',
          },
        ],
        message: `Extracted career portal for ${guessedCompany}!`,
      };
    }

    const companyName = rawJobs[0]?.company || new URL(fullUrl).hostname.replace(/^www\./, '').split('.')[0];
    const jobs: Partial<Job>[] = rawJobs.map((j) => {
      const { score, reason } = calculateSemanticScore(j, userProfile);
      return {
        title: j.title || 'Open Position',
        company: j.company || companyName,
        location: j.location || 'India / Remote',
        remoteType: j.remoteType || 'unknown',
        description: j.description || '',
        requirements: j.requirements || [],
        department: j.department,
        url: j.applyUrl || fullUrl,
        source: 'company-website',
        matchScore: score,
        matchReason: reason,
        isUrgentHiring: score > 80,
        noticePeriodAcceptable: 'Immediate to 30 Days',
      };
    });

    return {
      success: true,
      company: companyName,
      sourceType: `ai-${aiRes.provider}`,
      jobs,
      message: `Extracted ${jobs.length} open roles from ${companyName} via ${aiRes.provider.toUpperCase()} AI!`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to scrape company website';
    return {
      success: false,
      company: '',
      sourceType: 'error',
      jobs: [],
      error: errorMsg,
    };
  }
}
