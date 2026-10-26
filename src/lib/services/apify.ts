import { ApifyClient } from 'apify-client';
import { Job } from '@/types/job';
import { getAppSettings } from '@/lib/storage';

function getApifyClient(customToken?: string): ApifyClient {
  const settings = getAppSettings();
  const token = customToken || settings.apifyApiToken || process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error('Apify API token is missing. Please add it in Settings or set APIFY_API_TOKEN.');
  }
  return new ApifyClient({ token });
}

export interface ApifySearchParams {
  provider: 'google-jobs' | 'linkedin' | 'indeed' | 'custom';
  actorId?: string;
  queries: string[];
  location?: string;
  maxItems?: number;
}

export async function searchJobsWithApify(
  params: ApifySearchParams,
  customToken?: string
): Promise<Partial<Job>[]> {
  const client = getApifyClient(customToken);
  const maxItems = Math.min(params.maxItems || 10, 25);
  const queryStr = params.queries.join(' ');
  const locationStr = params.location || 'United States';

  let actorId = params.actorId;
  let actorInput: Record<string, unknown> = {};

  if (params.provider === 'google-jobs') {
    actorId = 'apify/google-jobs-scraper';
    actorInput = {
      queries: [`${queryStr} ${locationStr}`],
      maxItems,
      country: 'us',
    };
  } else if (params.provider === 'linkedin') {
    actorId = actorId || 'bebity/linkedin-jobs-scraper';
    actorInput = {
      title: queryStr,
      location: locationStr,
      rows: maxItems,
      publishedAt: 'r604800', // Past week
    };
  } else if (params.provider === 'indeed') {
    actorId = actorId || 'epctex/indeed-scraper';
    actorInput = {
      position: queryStr,
      location: locationStr,
      maxItems,
    };
  } else {
    if (!actorId) {
      throw new Error('Please specify an Actor ID for custom Apify search.');
    }
    actorInput = {
      query: queryStr,
      location: locationStr,
      maxItems,
    };
  }

  // Call the actor and await results
  const run = await client.actor(actorId).call(actorInput, {
    waitSecs: 90,
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems({
    limit: maxItems,
  });

  // Normalize various actor output schemas into standard Partial<Job>
  const normalizedJobs: Partial<Job>[] = items.map((item: Record<string, unknown>, index) => {
    const title =
      (item.title as string) ||
      (item.positionName as string) ||
      (item.jobTitle as string) ||
      `Job Posting #${index + 1}`;

    const company =
      (item.companyName as string) ||
      (item.company as string) ||
      (item.employer as string) ||
      'Unknown Company';

    const location =
      (item.location as string) ||
      (item.jobLocation as string) ||
      (item.city as string) ||
      locationStr;

    const url =
      (item.jobUrl as string) ||
      (item.url as string) ||
      (item.applyUrl as string) ||
      (item.link as string) ||
      '';

    const description =
      (item.description as string) ||
      (item.jobDescription as string) ||
      (item.descriptionText as string) ||
      (item.snippet as string) ||
      '';

    const salary =
      (item.salary as string) ||
      (item.salaryRange as string) ||
      (item.salaryString as string) ||
      undefined;

    const isRemote =
      (item.isRemote as boolean) ||
      location.toLowerCase().includes('remote') ||
      description.toLowerCase().includes('remote');

    return {
      title,
      company,
      location,
      remoteType: isRemote ? 'remote' : 'unknown',
      salary,
      url,
      description,
      source: 'apify',
    };
  });

  return normalizedJobs;
}
