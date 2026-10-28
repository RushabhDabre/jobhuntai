import { GoogleGenAI } from '@google/genai';
import { Job, UserProfile, MatchAnalysis } from '@/types/job';
import { getAppSettings } from '@/lib/storage';
import { executeAiWithFailover } from './aiRouter';

export function normalizeGeminiModel(model?: string): string {
  if (!model || model.startsWith('gemini-2.') || model.startsWith('gemini-1.') || model.includes('2.5-flash')) {
    return 'gemini-3.8-flash';
  }
  return model;
}

/**
 * Resilient Gemini Content Generator
 * Handles 503 (high demand) and 429 (rate limits) by:
 * 1. Backing off and retrying
 * 2. Cascading to alternative models (e.g. gemini-3.5-flash-lite, gemini-4-argon)
 */
export async function generateContentWithRetry(
  client: GoogleGenAI,
  preferredModel: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any,
  maxRetries = 2
) {
  const normPreferred = normalizeGeminiModel(preferredModel);
  // Fallback priority: preferred -> gemini-3.5-flash-lite (high throughput, rarely overloaded) -> gemini-4-argon
  const candidateModels = [
    normPreferred,
    normPreferred !== 'gemini-3.5-flash-lite' ? 'gemini-3.5-flash-lite' : 'gemini-3.8-flash',
    'gemini-4-argon',
  ].filter((v, i, a) => a.indexOf(v) === i);

  let lastError: unknown;

  for (const model of candidateModels) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await client.models.generateContent({
          ...params,
          model,
        });
        return response;
      } catch (err: unknown) {
        lastError = err;
        const msg = String(err).toLowerCase();
        const isTransient =
          msg.includes('503') ||
          msg.includes('high demand') ||
          msg.includes('unavailable') ||
          msg.includes('rate limit') ||
          msg.includes('resource_exhausted') ||
          msg.includes('429');

        if (!isTransient) {
          // If it's an auth error (401/403/invalid key), throw immediately without retrying
          throw err;
        }

        // Wait with backoff before retry or trying next model
        if (attempt < maxRetries) {
          await new Promise((res) => setTimeout(res, 1000 * (attempt + 1)));
        }
      }
    }
  }

  throw lastError;
}

async function getGenAIClient(customApiKey?: string) {
  const apiKey = customApiKey?.trim();
  if (!apiKey) {
    throw new Error('Please connect your Google Gemini API key. Each candidate uses their own free key to keep usage isolated and private.');
  }
  const settings = await getAppSettings();
  return {
    client: new GoogleGenAI({ apiKey }),
    model: normalizeGeminiModel(settings.defaultGeminiModel),
  };
}

export async function matchJobWithResume(
  job: Pick<Job, 'title' | 'company' | 'description' | 'location' | 'requirements' | 'salary' | 'salaryInLpa'>,
  profile: UserProfile,
  customApiKey?: string
): Promise<MatchAnalysis> {
  const prompt = `You are a Senior Technical Recruiter evaluating candidate fit for a software engineering position in India.
Evaluate the fit directly, crisply, and without boilerplate narrative essays.

CANDIDATE SKILLS & EXPERIENCE:
Preferred Locations: ${profile.preferredLocations?.join(', ') || 'Bengaluru, Pune, Hyderabad, Remote India'}
Years of Experience: ${profile.yearsOfExperience}
Notice Period: ${profile.noticePeriod || '30 Days'}
Key Skills: ${profile.skills?.join(', ')}
Candidate Background:
${profile.resumeText.slice(0, 3000)}

TARGET ROLE:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Salary: ${job.salaryInLpa || job.salary || 'Market Standard'}
Requirements: ${(job.requirements || []).join('; ')}
Description:
${job.description.slice(0, 3000)}

Respond strictly in valid JSON matching this schema:
{
  "score": number (0 to 100 integer representing candidate fit),
  "recommendation": "Strong Fit" | "Good Match" | "Borderline" | "Not Recommended",
  "summary": "1 single crisp bullet-style sentence stating direct match points (e.g. 'Strong overlap with your React & Spring Boot stack; favorable immediate joiner availability.'). NEVER mention third-person name, write directly as 'Strong match for your...'",
  "strengths": ["top matching technical strength 1", "strength 2", "strength 3"],
  "gaps": ["missing requirement or screening preparation point 1"],
  "interviewTalkingPoints": ["key project or achievement from your resume to highlight"],
  "indiaRelevance": {
    "locationFit": "analysis of location/remote fit",
    "salaryFit": "comparison with market standard",
    "noticePeriodFit": "favorable immediate joining status"
  }
}`;

  try {
    const aiResult = await executeAiWithFailover({
      prompt,
      responseJson: true,
      profile,
      customKeys: {
        gemini: customApiKey?.startsWith('AIza') ? customApiKey : undefined,
        groq: customApiKey?.startsWith('gsk_') ? customApiKey : undefined,
      },
      preferredProvider: profile.preferredAiProvider || 'gemini',
      autoFailover: profile.autoFailover !== false,
    });

    const cleanJson = (aiResult.text || '{}').replace(/```json\n?|\n?```/g, '').trim();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any = {};
    try {
      parsed = JSON.parse(cleanJson);
    } catch {
      parsed = {};
    }

    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || 72)),
      recommendation: parsed.recommendation || 'Good Match',
      summary: parsed.summary || (aiResult.didFailover ? `Profile evaluated via ${aiResult.provider} (${aiResult.model}).` : 'Profile evaluated against job criteria.'),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
      interviewTalkingPoints: Array.isArray(parsed.interviewTalkingPoints) ? parsed.interviewTalkingPoints : [],
      indiaRelevance: parsed.indiaRelevance || {
        locationFit: 'Evaluated against Indian locations',
        salaryFit: 'Within expected market range',
        noticePeriodFit: `${profile.noticePeriod || '30 Days'} notice period`,
      },
      evaluatedAt: new Date().toISOString(),
    };
  } catch (error: unknown) {
    console.error('AI match error:', error);
    throw error;
  }
}

export async function generatePitch(
  job: Pick<Job, 'title' | 'company' | 'description'>,
  profile: UserProfile,
  pitchType: 'cover_letter' | 'cold_email' | 'linkedin_dm' = 'linkedin_dm',
  customApiKey?: string
): Promise<string> {
  let styleGuide = '';
  if (pitchType === 'cover_letter') {
    styleGuide = 'Write a concise, compelling 3-paragraph tailored cover letter for Indian tech recruiters. Highlight years of experience, key tech stack match, and immediate notice period readiness.';
  } else if (pitchType === 'cold_email') {
    styleGuide = `Write a high-converting recruiter cold email for the Indian tech market.
Format:
Subject: Application: ${job.title} | ${profile.name} | ${profile.yearsOfExperience}+ Yrs Exp | ${profile.noticePeriod} Notice
Body: Crisp under 150 words highlighting top 3 tech achievements, current/expected CTC openness, and portfolio/GitHub link.`;
  } else {
    styleGuide = `Write a polite, punchy LinkedIn connection request / direct message (under 80 words) to an Indian tech recruiter or engineering manager.
Mention role, total experience, primary tech stack (e.g. React/Next.js/Node.js), and availability to connect.`;
  }

  const prompt = `You are an elite career strategist for Indian software engineers.
${styleGuide}

CANDIDATE:
Name: ${profile.name}
Location: ${profile.currentLocation}
Years of Experience: ${profile.yearsOfExperience}
Notice Period: ${profile.noticePeriod}
Core Skills: ${profile.skills.join(', ')}
Resume Highlights:
${profile.resumeText.slice(0, 2000)}

TARGET ROLE:
Role: ${job.title} at ${job.company}
Description:
${job.description.slice(0, 3000)}

Output ONLY the exact text ready to send.`;

  const aiResult = await executeAiWithFailover({
    prompt,
    profile,
    customKeys: {
      gemini: customApiKey?.startsWith('AIza') ? customApiKey : undefined,
      groq: customApiKey?.startsWith('gsk_') ? customApiKey : undefined,
    },
    preferredProvider: profile.preferredAiProvider || 'gemini',
    autoFailover: profile.autoFailover !== false,
  });

  return aiResult.text.trim();
}

export async function parseJobWithAI(
  rawContent: string,
  sourceUrl: string,
  customApiKey?: string
): Promise<Partial<Job>> {
  const { client, model } = await getGenAIClient(customApiKey);

  const prompt = `Extract structured job posting details from this scraped text. Focus on Indian tech market parameters (City in India, CTC in LPA if mentioned, experience required).
Source URL: ${sourceUrl}

Raw Content:
${rawContent.slice(0, 6000)}

Respond strictly in valid JSON matching this schema:
{
  "title": "exact job title",
  "company": "company name",
  "location": "location (e.g., Bengaluru, Pune, Hyderabad, Gurgaon, Mumbai, Remote India)",
  "city": "Bengaluru" | "Hyderabad" | "Pune" | "Delhi-NCR" | "Mumbai" | "Chennai" | "Remote",
  "remoteType": "remote" | "hybrid" | "onsite" | "unknown",
  "salaryInLpa": "e.g. ₹25 - ₹35 LPA if mentioned, or empty string",
  "experienceRequired": "e.g. 3-5 years if mentioned, or empty string",
  "department": "department or team if mentioned",
  "requirements": ["requirement 1", "requirement 2", ...],
  "description": "clean, well-formatted markdown of job description and responsibilities"
}`;

  try {
    const response = await generateContentWithRetry(client, model, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    return {
      title: parsed.title || 'Untitled Role',
      company: parsed.company || 'Unknown Company',
      location: parsed.location || 'Bengaluru / Remote (India)',
      city: parsed.city || undefined,
      remoteType: parsed.remoteType || 'unknown',
      salaryInLpa: parsed.salaryInLpa || undefined,
      salary: parsed.salaryInLpa || undefined,
      experienceRequired: parsed.experienceRequired || undefined,
      department: parsed.department || undefined,
      requirements: Array.isArray(parsed.requirements) ? parsed.requirements : [],
      description: parsed.description || rawContent.slice(0, 1000),
      url: sourceUrl,
    };
  } catch (error) {
    console.error('Failed to parse job with AI:', error);
    return {
      title: 'Scraped Job',
      company: 'Company',
      location: 'Bengaluru / Remote',
      description: rawContent.slice(0, 1500),
      url: sourceUrl,
    };
  }
}
