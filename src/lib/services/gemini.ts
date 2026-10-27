import { GoogleGenAI } from '@google/genai';
import { Job, UserProfile, MatchAnalysis } from '@/types/job';
import { getAppSettings } from '@/lib/storage';

async function getGenAIClient(customApiKey?: string) {
  const settings = await getAppSettings();
  const apiKey = customApiKey || settings.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is missing. Please configure it in Settings or set GEMINI_API_KEY.');
  }
  return {
    client: new GoogleGenAI({ apiKey }),
    model: settings.defaultGeminiModel || 'gemini-2.5-flash',
  };
}

export async function matchJobWithResume(
  job: Pick<Job, 'title' | 'company' | 'description' | 'location' | 'requirements' | 'salary' | 'salaryInLpa'>,
  profile: UserProfile,
  customApiKey?: string
): Promise<MatchAnalysis> {
  const { client, model } = await getGenAIClient(customApiKey);

  const prompt = `You are a Principal Tech Recruiter and Career Strategist specializing in the Indian Tech Industry (Bangalore, Pune, Hyderabad, Delhi-NCR, Mumbai, and Remote India).
Evaluate how well this candidate matches the target job opening to help them LAND AN ACTUAL JOB.

CANDIDATE PROFILE (INDIA MARKET):
Name: ${profile.name}
Current Location: ${profile.currentLocation}
Preferred Locations in India: ${profile.preferredLocations?.join(', ') || 'Bengaluru, Pune, Hyderabad, Remote India'}
Years of Experience: ${profile.yearsOfExperience}
Notice Period: ${profile.noticePeriod || '30 Days'}
Current CTC: ${profile.currentCtc || 'Not specified'}
Expected CTC: ${profile.expectedCtc || 'Not specified'}
Target Roles: ${profile.targetTitles?.join(', ')}
Key Skills: ${profile.skills?.join(', ')}
Candidate Resume & Background:
${profile.resumeText}

TARGET JOB OPENING:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Salary / CTC: ${job.salaryInLpa || job.salary || 'Market Standard'}
Key Requirements: ${(job.requirements || []).join('; ')}
Job Description:
${job.description.slice(0, 4000)}

Analyze with high rigor. Focus on actionable insights that help the candidate pass technical screening and get interview shortlists in India.

Respond strictly in valid JSON matching this schema:
{
  "score": number (0 to 100 integer representing candidate fit),
  "recommendation": "Strong Fit" | "Good Match" | "Borderline" | "Not Recommended",
  "summary": "2-3 crisp sentences summarizing why the candidate is a viable match for this role",
  "strengths": ["specific strength 1 relative to job description", "specific strength 2", ...],
  "gaps": ["specific gap or missing requirement 1", ...],
  "interviewTalkingPoints": ["tactical technical story or project from resume to highlight in screening round 1", "talking point 2"],
  "indiaRelevance": {
    "locationFit": "analysis of location/remote fit (e.g. In candidate preferred city Bengaluru / Remote India)",
    "salaryFit": "comparison with candidate expected CTC",
    "noticePeriodFit": "whether candidate's notice period is favorable for this role"
  }
}`;

  try {
    const response = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || 70)),
      recommendation: parsed.recommendation || 'Good Match',
      summary: parsed.summary || 'Profile evaluated against job criteria.',
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
    console.error('Gemini match error:', error);
    throw error;
  }
}

export async function generatePitch(
  job: Pick<Job, 'title' | 'company' | 'description'>,
  profile: UserProfile,
  pitchType: 'cover_letter' | 'cold_email' | 'linkedin_dm' = 'linkedin_dm',
  customApiKey?: string
): Promise<string> {
  const { client, model } = await getGenAIClient(customApiKey);

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

  const response = await client.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text?.trim() || '';
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
    const response = await client.models.generateContent({
      model,
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
