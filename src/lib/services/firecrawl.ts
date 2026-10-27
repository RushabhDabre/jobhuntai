import FirecrawlApp from '@mendable/firecrawl-js';
import { Job } from '@/types/job';
import { getAppSettings } from '@/lib/storage';
import { parseJobWithAI } from './gemini';

async function getFirecrawlClient(customApiKey?: string): Promise<FirecrawlApp> {
  const settings = await getAppSettings();
  const apiKey = customApiKey || settings.firecrawlApiKey || process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error('Firecrawl API key is missing. Please add it in Settings or set FIRECRAWL_API_KEY.');
  }
  return new FirecrawlApp({ apiKey });
}

export interface ScrapeJobResult {
  job: Partial<Job>;
  rawMarkdown?: string;
}

export async function scrapeJobWithFirecrawl(
  url: string,
  customApiKey?: string
): Promise<ScrapeJobResult> {
  const firecrawl = await getFirecrawlClient(customApiKey);

  // Scrape single URL to markdown and metadata
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scrapeResponse: any = await firecrawl.scrapeUrl(url, {
    formats: ['markdown'],
  });

  if (!scrapeResponse) {
    throw new Error('Firecrawl returned an empty response.');
  }

  const markdown: string = scrapeResponse.markdown || '';
  const metadata = scrapeResponse.metadata || {};

  // Try parsing structured details using Gemini if available
  let structuredJob: Partial<Job>;
  try {
    structuredJob = await parseJobWithAI(markdown, url);
  } catch {
    structuredJob = {
      title: metadata.title || 'Job Opening',
      company: metadata.ogSiteName || metadata.sourceURL || 'Company',
      location: 'Remote / See description',
      description: markdown,
      url,
    };
  }

  return {
    job: {
      ...structuredJob,
      url,
      source: 'firecrawl',
    },
    rawMarkdown: markdown,
  };
}

export async function crawlCareerPageWithFirecrawl(
  baseUrl: string,
  limit: number = 5,
  customApiKey?: string
): Promise<string[]> {
  const firecrawl = await getFirecrawlClient(customApiKey);

  // Use map to find all relevant job links on the careers domain
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapResponse: any = await firecrawl.mapUrl(baseUrl, {
      search: 'job, career, position, opening, engineer, developer',
      limit,
    });

    if (mapResponse && mapResponse.links) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const extractedLinks: string[] = mapResponse.links.map((linkItem: any) => {
        if (typeof linkItem === 'string') return linkItem;
        if (linkItem && typeof linkItem.url === 'string') return linkItem.url;
        return '';
      }).filter(Boolean);

      return extractedLinks.slice(0, limit);
    }
  } catch (err) {
    console.warn('Firecrawl mapUrl failed, falling back to direct scrape:', err);
  }

  return [baseUrl];
}
