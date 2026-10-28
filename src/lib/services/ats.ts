import { Job } from '@/types/job';

export interface AtsHarvestParams {
  platform: 'greenhouse' | 'lever' | 'ashby';
  companySlug: string;
  keywordFilter?: string;
  limit?: number;
}

export async function harvestFromAts(params: AtsHarvestParams): Promise<Partial<Job>[]> {
  const { platform, companySlug, keywordFilter, limit = 15 } = params;
  const slug = companySlug.trim().toLowerCase();
  const filter = (keywordFilter || '').toLowerCase().trim();

  if (platform === 'greenhouse') {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch Greenhouse board for "${slug}": ${res.statusText}`);
    }
    const data = await res.json();
    const rawJobs = (data.jobs || []) as Array<{
      id: number;
      title: string;
      location?: { name: string };
      absolute_url: string;
      content?: string;
      departments?: Array<{ name: string }>;
    }>;

    return rawJobs
      .filter((j) => matchesKeyword(j.title + ' ' + (j.content || ''), filter))
      .slice(0, limit)
      .map((j) => ({
        title: j.title,
        company: slug.charAt(0).toUpperCase() + slug.slice(1),
        location: j.location?.name || 'Unknown',
        remoteType: (j.location?.name || '').toLowerCase().includes('remote') ? 'remote' : 'unknown',
        url: j.absolute_url,
        description: cleanHtml(j.content || ''),
        department: j.departments?.[0]?.name,
        source: 'greenhouse',
      }));
  }

  if (platform === 'lever') {
    const res = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch Lever board for "${slug}": ${res.statusText}`);
    }
    const rawJobs = (await res.json()) as Array<{
      id: string;
      text: string;
      hostedUrl: string;
      categories?: { location?: string; commitment?: string; team?: string };
      descriptionPlain?: string;
      description?: string;
    }>;

    return rawJobs
      .filter((j) => matchesKeyword(j.text + ' ' + (j.descriptionPlain || j.description || ''), filter))
      .slice(0, limit)
      .map((j) => ({
        title: j.text,
        company: slug.charAt(0).toUpperCase() + slug.slice(1),
        location: j.categories?.location || 'Unknown',
        remoteType: (j.categories?.location || '').toLowerCase().includes('remote') ? 'remote' : 'unknown',
        url: j.hostedUrl,
        description: j.descriptionPlain || cleanHtml(j.description || ''),
        department: j.categories?.team,
        source: 'lever',
      }));
  }

  if (platform === 'ashby') {
    const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${slug}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch Ashby board for "${slug}": ${res.statusText}`);
    }
    const data = await res.json();
    const rawJobs = (data.jobs || []) as Array<{
      id: string;
      title: string;
      location?: string;
      isRemote?: boolean;
      jobUrl: string;
      descriptionHtml?: string;
      department?: string;
    }>;

    return rawJobs
      .filter((j) => matchesKeyword(j.title + ' ' + (j.descriptionHtml || ''), filter))
      .slice(0, limit)
      .map((j) => ({
        title: j.title,
        company: slug.charAt(0).toUpperCase() + slug.slice(1),
        location: j.location || (j.isRemote ? 'Remote' : 'Unknown'),
        remoteType: j.isRemote ? 'remote' : 'unknown',
        url: j.jobUrl,
        description: cleanHtml(j.descriptionHtml || ''),
        department: j.department,
        source: 'ashby',
      }));
  }

  throw new Error(`Unsupported ATS platform: ${platform}`);
}

function matchesKeyword(text: string, filter: string): boolean {
  if (!filter) return true;
  const lowerText = text.toLowerCase();
  const lowerFilter = filter.toLowerCase().trim();
  if (lowerText.includes(lowerFilter)) return true;

  // Split into significant terms
  const terms = lowerFilter
    .split(/[\s,/\\-]+/)
    .filter((w) => w.length >= 3 && !['and', 'for', 'the', 'with', 'senior', 'lead', 'developer', 'engineer', 'consultant'].includes(w));

  if (terms.length === 0) {
    // If only generic words like "Engineer" remain, match any of them
    const genericTerms = lowerFilter.split(/[\s,/\\-]+/).filter((w) => w.length >= 3);
    return genericTerms.some((t) => lowerText.includes(t));
  }

  return terms.some((term) => lowerText.includes(term));
}

function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
