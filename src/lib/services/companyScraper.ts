import { Job, UserProfile } from '@/types/job';
import { harvestFromAts } from './ats';
import { executeAiWithFailover } from './aiRouter';
import { getAppSettings } from '../storage';
import { withTimeout } from '@/lib/timeout';
import { searchJobsWithApify } from './apify';
import FirecrawlApp from '@mendable/firecrawl-js';

export interface CompanyScrapeResult {
  success: boolean;
  company: string;
  sourceType: string;
  jobs: Partial<Job>[];
  message?: string;
  error?: string;
}

export const KNOWN_COMPANY_PORTALS: Record<
  string,
  { company: string; url: string; ats?: { platform: 'greenhouse' | 'lever' | 'ashby'; slug: string } }
> = {
  swiggy: { company: 'Swiggy', url: 'https://jobs.lever.co/swiggy', ats: { platform: 'lever', slug: 'swiggy' } },
  razorpay: { company: 'Razorpay', url: 'https://boards.greenhouse.io/razorpay', ats: { platform: 'greenhouse', slug: 'razorpay' } },
  cred: { company: 'CRED', url: 'https://boards.greenhouse.io/cred', ats: { platform: 'greenhouse', slug: 'cred' } },
  browserstack: { company: 'BrowserStack', url: 'https://jobs.ashbyhq.com/browserstack', ats: { platform: 'ashby', slug: 'browserstack' } },
  zepto: { company: 'Zepto', url: 'https://jobs.lever.co/zepto', ats: { platform: 'lever', slug: 'zepto' } },
  postman: { company: 'Postman', url: 'https://boards.greenhouse.io/postman', ats: { platform: 'greenhouse', slug: 'postman' } },
  atlassian: { company: 'Atlassian', url: 'https://boards.greenhouse.io/atlassian', ats: { platform: 'greenhouse', slug: 'atlassian' } },
  hasura: { company: 'Hasura', url: 'https://jobs.lever.co/hasura', ats: { platform: 'lever', slug: 'hasura' } },
  wipro: { company: 'Wipro', url: 'https://careers.wipro.com' },
  tcs: { company: 'TCS', url: 'https://www.tcs.com/careers' },
  infosys: { company: 'Infosys', url: 'https://www.infosys.com/careers' },
  zomato: { company: 'Zomato', url: 'https://www.zomato.com/careers' },
  flipkart: { company: 'Flipkart', url: 'https://www.flipkartcareers.com' },
  phonepe: { company: 'PhonePe', url: 'https://www.phonepe.com/careers' },
  accenture: { company: 'Accenture', url: 'https://www.accenture.com/in-en/careers' },
  cognizant: { company: 'Cognizant', url: 'https://careers.cognizant.com' },
  capgemini: { company: 'Capgemini', url: 'https://www.capgemini.com/in-en/careers' },
  microsoft: { company: 'Microsoft', url: 'https://careers.microsoft.com' },
  amazon: { company: 'Amazon', url: 'https://www.amazon.jobs' },
  google: { company: 'Google', url: 'https://careers.google.com' },
};

/**
 * Extracts company name cleanly from URL
 */
function extractCompanyNameFromUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const pathname = url.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
    const firstSegment = pathname.split('/')[0] || '';

    // Check known ATS patterns
    if (host.includes('greenhouse.io')) {
      const seg = firstSegment === 'embed' ? pathname.split('/')[1] : firstSegment;
      if (seg) return capitalize(seg);
    }
    if (host.includes('lever.co')) {
      if (firstSegment) return capitalize(firstSegment);
    }
    if (host.includes('ashbyhq.com')) {
      if (firstSegment) return capitalize(firstSegment);
    }

    // Common Indian & Global Tech Domains
    if (host.includes('wipro')) return 'Wipro';
    if (host.includes('tcs')) return 'TCS';
    if (host.includes('infosys')) return 'Infosys';
    if (host.includes('swiggy')) return 'Swiggy';
    if (host.includes('razorpay')) return 'Razorpay';
    if (host.includes('cred')) return 'CRED';
    if (host.includes('browserstack')) return 'BrowserStack';
    if (host.includes('zepto')) return 'Zepto';
    if (host.includes('postman')) return 'Postman';
    if (host.includes('accenture')) return 'Accenture';
    if (host.includes('cognizant')) return 'Cognizant';
    if (host.includes('capgemini')) return 'Capgemini';
    if (host.includes('zomato')) return 'Zomato';
    if (host.includes('flipkart')) return 'Flipkart';
    if (host.includes('phonepe')) return 'PhonePe';
    if (host.includes('google')) return 'Google';
    if (host.includes('microsoft')) return 'Microsoft';
    if (host.includes('amazon')) return 'Amazon';

    const parts = host.split('.');
    for (const part of parts) {
      if (!['careers', 'jobs', 'apply', 'boards', 'com', 'in', 'org', 'co', 'io', 'net', 'global', 'portal', 'search'].includes(part)) {
        return capitalize(part);
      }
    }
    return 'Target Company';
  } catch {
    return 'Target Company';
  }
}

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
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

    if (host.includes('greenhouse.io')) {
      const slug = segments[0] === 'embed' ? segments[1] : segments[0];
      if (slug && slug !== 'jobapp') return { platform: 'greenhouse', slug };
    }
    if (host.includes('lever.co')) {
      const slug = segments[0];
      if (slug) return { platform: 'lever', slug };
    }
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
    .slice(0, 20000);
}

/**
 * Calculates a realistic semantic match percentage (0-100) between candidate profile and a job
 */
export function calculateSemanticScore(job: Partial<Job>, profile?: UserProfile | null): { score: number; reason: string } {
  if (!profile) {
    return { score: 85, reason: 'Relevant software engineering opening matching industry standards.' };
  }

  let score = 55;
  const reasons: string[] = [];

  const jobText = `${job.title || ''} ${job.description || ''} ${(job.requirements || []).join(' ')} ${job.department || ''}`.toLowerCase();
  const targetRoles = (profile.targetTitles || []).map((r) => r.toLowerCase());
  const skills = (profile.skills || []).map((s) => s.toLowerCase());
  const preferredTechs = (profile.preferredTechnologies || []).map((t) => t.toLowerCase());
  const candidateLocations = (profile.preferredLocations || []).map((l) => l.toLowerCase());

  // 1. Target Role Alignment (+20 max)
  const titleLower = (job.title || '').toLowerCase();
  const directRoleMatch = targetRoles.some((r) => titleLower.includes(r) || r.includes(titleLower));
  if (directRoleMatch) {
    score += 20;
    reasons.push('Direct match for your target role');
  } else {
    const words = titleLower.split(/\s+/).filter((w) => w.length > 3);
    const partialMatch = targetRoles.some((r) => words.some((w) => r.includes(w)));
    if (partialMatch) {
      score += 12;
      reasons.push('Aligned engineering track');
    }
  }

  // 2. Tech Stack & Skills Overlap (+20 max)
  const allTechs = Array.from(new Set([...skills, ...preferredTechs]));
  const matchedTechs = allTechs.filter((tech) => jobText.includes(tech));
  if (matchedTechs.length >= 3) {
    score += 20;
    reasons.push(`Strong overlap with ${matchedTechs.slice(0, 3).join(', ')}`);
  } else if (matchedTechs.length >= 1) {
    score += 12;
    reasons.push(`Matches your ${matchedTechs.slice(0, 2).join(' & ')} skills`);
  }

  // 3. Location & Remote Flexibility (+10 max)
  const jobLoc = (job.location || '').toLowerCase();
  const isRemote = job.remoteType === 'remote' || jobLoc.includes('remote');
  const locationMatch = candidateLocations.some((loc) => jobLoc.includes(loc.replace(/\(.*\)/, '').trim()));
  if (isRemote || locationMatch) {
    score += 10;
    reasons.push(`In your preferred location (${job.location || 'Remote'})`);
  }

  // 4. Notice Period & Urgent Hiring Bonus ONLY if the job itself explicitly requires urgent hiring
  const isUrgent = Boolean(
    job.isUrgentHiring ||
    jobText.match(/\b(urgent|immediate|urgently|immediate joiner|15 days|serving notice)\b/i)
  );
  if (isUrgent && (profile.noticePeriod === 'Immediate Joiner' || profile.noticePeriod === '15 Days')) {
    score += 8;
    reasons.push('Urgent hiring role fits your immediate availability');
  }

  const finalScore = Math.min(97, Math.max(65, score));
  const reasonText = reasons.length > 0 ? reasons.join(' • ') : 'Relevant tech role matching your profile experience.';

  return { score: finalScore, reason: reasonText };
}

/**
 * Scrapes all open jobs from a company career portal matching the candidate's profile
 */
export async function scrapeCompanyCareerUrl(
  inputUrl: string,
  userProfile?: UserProfile | null
): Promise<CompanyScrapeResult> {
  const trimmed = inputUrl.trim();
  if (!trimmed) {
    return { success: false, company: '', sourceType: 'none', jobs: [], error: 'Company name or URL is required' };
  }

  const lookupKey = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
  const known = KNOWN_COMPANY_PORTALS[lookupKey];

  let fullUrl: string;
  let companyName: string;
  let atsInfo: { platform: 'greenhouse' | 'lever' | 'ashby'; slug: string } | null = null;

  if (known) {
    fullUrl = known.url;
    companyName = known.company;
    atsInfo = known.ats || null;
  } else if (!trimmed.includes('.') && !trimmed.startsWith('http')) {
    // User entered a plain company name e.g. "Oracle" or "Swiggy"
    companyName = capitalize(trimmed);
    fullUrl = `https://careers.${trimmed.toLowerCase()}.com`;
  } else {
    // User entered a URL
    fullUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    companyName = extractCompanyNameFromUrl(fullUrl);
    atsInfo = detectAtsFromUrl(fullUrl);
  }

  // Candidate context
  const targetRoles = userProfile?.targetTitles?.length ? userProfile.targetTitles : ['Full Stack Developer', 'Software Engineer'];
  const skills = userProfile?.skills?.length ? userProfile.skills : ['React', 'Node.js', 'Spring Boot', 'Java', 'TypeScript'];
  const locations = userProfile?.preferredLocations?.length ? userProfile.preferredLocations : ['Pune', 'Bengaluru', 'Mumbai', 'Remote (India)'];

  // Step 1: Check known ATS platforms (Greenhouse, Lever, Ashby)
  if (atsInfo) {
    try {
      const harvested = await withTimeout(
        harvestFromAts({
          platform: atsInfo.platform,
          companySlug: atsInfo.slug,
          limit: 15,
        }),
        6000,
        'ATS harvest timed out after 6s'
      );

      if (harvested && harvested.length > 0) {
        const jobs: Partial<Job>[] = harvested.map((j) => {
          const { score, reason } = calculateSemanticScore(j, userProfile);
          return {
            ...j,
            company: companyName,
            source: atsInfo!.platform,
            matchScore: score,
            matchReason: reason,
            salary: j.salary || 'Not Disclosed',
            salaryInLpa: j.salaryInLpa,
            isUrgentHiring: Boolean(j.description?.match(/\b(urgent|immediate|urgently|15 days)\b/i)),
          };
        });

        return {
          success: true,
          company: companyName,
          sourceType: atsInfo.platform,
          jobs,
          message: `Successfully extracted ${jobs.length} open roles directly from ${companyName}'s career portal!`,
        };
      }
    } catch (atsErr: unknown) {
      console.warn(`Direct ATS fetch failed for ${atsInfo.slug}, continuing to deep scraper:`, atsErr);
    }
  }

  // Step 2: Extract text content using Firecrawl or direct fetch
  let pageContent = '';
  const settings = await getAppSettings();

  if (settings.firecrawlApiKey) {
    try {
      const firecrawl = new FirecrawlApp({ apiKey: settings.firecrawlApiKey });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scrapeRes: any = await withTimeout(
        firecrawl.scrapeUrl(fullUrl, { formats: ['markdown'] }),
        6500,
        'Firecrawl scraping timed out after 6.5s'
      );
      if (scrapeRes?.markdown) {
        pageContent = scrapeRes.markdown.slice(0, 16000);
      }
    } catch (fcErr) {
      console.warn('Firecrawl page fetch error, falling back to direct web fetch:', fcErr);
    }
  }

  if (!pageContent) {
    try {
      const webRes = await fetch(fullUrl, {
        signal: AbortSignal.timeout(6000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      if (webRes.ok) {
        const html = await webRes.text();
        pageContent = cleanHtmlForScraping(html);
      }
    } catch {
      // Continue to AI or platform fallbacks
    }
  }

  // Step 3: AI-Powered Job Extraction from scraped page
  let rawJobs: Array<{
    title?: string;
    company?: string;
    location?: string;
    remoteType?: 'remote' | 'hybrid' | 'onsite';
    experienceRequired?: string;
    salaryInLpa?: string;
    requirements?: string[];
    description?: string;
    applyUrl?: string;
    isUrgentHiring?: boolean;
  }> = [];

  if (pageContent && pageContent.length > 50) {
    try {
      const aiPrompt = `You are a Technical Job Data Extractor.
Extract ONLY ACTUAL, REAL job openings explicitly listed in the following text from ${companyName}'s career page (${fullUrl}).

WEBPAGE SCRAPED CONTENT:
${pageContent.slice(0, 15000)}

CRITICAL RULES:
1. Extract ONLY specific job positions that are EXPLICITLY present in the text above.
2. DO NOT fabricate, invent, or make up vacancies.
3. DO NOT generate placeholder query links with "?q=". If no specific job URL is found in the text, use "${fullUrl}".
4. If the webpage contains NO individual job postings (e.g. it is only a search form, error page, or company intro), return an empty JSON array: []
5. For each real job found in the text, return:
   - "title": Exact job title from the text
   - "company": "${companyName}"
   - "location": Location specified in text (or "India")
   - "remoteType": "remote" | "hybrid" | "onsite"
   - "experienceRequired": Experience mentioned in text or undefined
   - "salaryInLpa": Salary mentioned in text or undefined (NEVER invent salary numbers)
   - "requirements": Technical skills mentioned for this role
   - "description": Summary of the role as written in the text
   - "applyUrl": Real job link or job ID link found in the page
   - "isUrgentHiring": true ONLY if the text explicitly states "urgent", "immediate joiner", or "15 days". Otherwise false.

Return a valid JSON array: [ { ... }, { ... } ]`;

      const aiRes = await withTimeout(
        executeAiWithFailover({
          prompt: aiPrompt,
          systemPrompt: 'You extract only real job listings from webpage content. If no specific vacancies are listed, you output an empty JSON array []. NEVER fabricate job titles or URLs.',
          responseJson: true,
          profile: userProfile,
        }),
        10000,
        'AI job extraction timed out'
      );

      const cleanJson = (aiRes.text || '[]').replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed)) {
        rawJobs = parsed;
      } else if (parsed && Array.isArray(parsed.jobs)) {
        rawJobs = parsed.jobs;
      }
    } catch (aiErr) {
      console.warn('AI job extraction skipped or encountered an error:', aiErr);
    }
  }

  // Filter out any generic company placeholders
  rawJobs = rawJobs.filter(
    (j) =>
      j.title &&
      !j.title.toLowerCase().includes('limited jobs') &&
      !j.title.toLowerCase().includes('company jobs') &&
      j.title !== companyName &&
      j.title !== `${companyName} Jobs`
  );

  // If real jobs were extracted from the portal HTML
  if (rawJobs.length > 0) {
    const jobs: Partial<Job>[] = rawJobs.map((j) => {
      const { score, reason } = calculateSemanticScore(j, userProfile);
      const isUrgent = Boolean(
        j.isUrgentHiring ||
        (j.description && /\b(urgent|immediate|urgently|15 days)\b/i.test(j.description)) ||
        (j.title && /\b(urgent|immediate)\b/i.test(j.title))
      );

      let cleanUrl = j.applyUrl || fullUrl;
      if (cleanUrl.includes('?q=') || cleanUrl.includes('&q=') || cleanUrl.includes('/search?')) {
        cleanUrl = fullUrl;
      } else if (cleanUrl.startsWith('/')) {
        try {
          cleanUrl = new URL(cleanUrl, fullUrl).href;
        } catch {
          cleanUrl = fullUrl;
        }
      }

      return {
        title: j.title || 'Software Engineer',
        company: companyName,
        location: j.location || locations[0] || 'India / Remote',
        remoteType: j.remoteType || 'unknown',
        experienceRequired: j.experienceRequired,
        salaryInLpa: j.salaryInLpa || undefined,
        salary: j.salaryInLpa || 'Not Disclosed',
        description: j.description || `${j.title} at ${companyName}`,
        requirements: j.requirements || skills.slice(0, 4),
        url: cleanUrl,
        source: 'company-website',
        matchScore: score,
        matchReason: reason,
        isUrgentHiring: isUrgent,
      };
    });

    return {
      success: true,
      company: companyName,
      sourceType: 'portal-scraper',
      jobs,
      message: `Scraped ${jobs.length} open positions directly from ${companyName}'s career portal!`,
    };
  }

  // Step 4: If portal is JS-rendered/blocked, attempt to find real jobs via Apify (if token available)
  if (settings.apifyApiToken) {
    try {
      const apifyJobs = await withTimeout(
        searchJobsWithApify(
          {
            provider: 'linkedin',
            queries: [`${companyName} ${targetRoles[0] || 'Software Engineer'}`],
            location: locations[0] || 'India',
            maxItems: 8,
          },
          settings.apifyApiToken
        ),
        10000,
        'Apify live search timed out'
      );

      if (apifyJobs && apifyJobs.length > 0) {
        const jobs: Partial<Job>[] = apifyJobs.map((j) => {
          const { score, reason } = calculateSemanticScore(j, userProfile);
          return {
            ...j,
            company: companyName,
            source: 'linkedin-india',
            matchScore: score,
            matchReason: reason,
            salary: j.salary || 'Not Disclosed',
            isUrgentHiring: Boolean(j.description?.match(/\b(urgent|immediate|urgently|15 days)\b/i)),
          };
        });

        return {
          success: true,
          company: companyName,
          sourceType: 'linkedin',
          jobs,
          message: `Found ${jobs.length} verified live openings for ${companyName} via LinkedIn Jobs!`,
        };
      }
    } catch (apifyErr) {
      console.warn('Apify live search failed for ' + companyName, apifyErr);
    }
  }

  // Step 5: If no jobs could be scraped, return an honest message instead of fabricating fake data
  return {
    success: false,
    company: companyName,
    sourceType: 'portal-blocked',
    jobs: [],
    error: `Could not extract live vacancies from ${companyName}. The portal (${fullUrl}) uses dynamic JavaScript/anti-bot protection (e.g. Workday, SAP SuccessFactors) which blocks automated web scrapers. You can visit their career portal directly at ${fullUrl} or configure an Apify API key in Settings (⚙️) to query their live LinkedIn postings.`,
  };
}
