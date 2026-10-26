import { GoogleGenAI } from '@google/genai';
import { Job, UserProfile, MatchAnalysis } from '@/types/job';
import { getAppSettings } from '@/lib/storage';

function getGenAIClient(customApiKey?: string) {
  const settings = getAppSettings();
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
  job: Pick<Job, 'title' | 'company' | 'description' | 'location' | 'requirements'>,
  profile: UserProfile,
  customApiKey?: string
): Promise<MatchAnalysis> {
  const { client, model } = getGenAIClient(customApiKey);

  const prompt = `You are an elite career coach and senior technical recruiter.
Evaluate how well the candidate's profile matches the target job opening.

CANDIDATE PROFILE:
Name: ${profile.name}
Target Titles: ${profile.targetTitles.join(', ')}
Years of Experience: ${profile.yearsOfExperience}
Key Skills: ${profile.skills.join(', ')}
Preferred Remote: ${profile.preferredRemote ? 'Yes' : 'No'}
Target Locations: ${profile.targetLocations.join(', ')}
Candidate Resume & Background:
${profile.resumeText}

TARGET JOB OPENING:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Key Requirements: ${(job.requirements || []).join('; ')}
Job Description:
${job.description.slice(0, 4000)}

Analyze the fit thoroughly. Be honest, constructive, and realistic.
Respond strictly in JSON matching this schema:
{
  "score": number (0 to 100 integer representing candidate fit),
  "recommendation": "Strong Fit" | "Good Match" | "Borderline" | "Not Recommended",
  "summary": "2-3 sentences summarizing why this candidate is or isn't a fit",
  "strengths": ["specific strength 1 relative to job", "specific strength 2", ...],
  "gaps": ["missing requirement or experience gap 1", ...],
  "interviewTalkingPoints": ["tactical story or project from resume to emphasize in interview 1", "talking point 2"]
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
      summary: parsed.summary || 'Profile reviewed against job description.',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
      interviewTalkingPoints: Array.isArray(parsed.interviewTalkingPoints) ? parsed.interviewTalkingPoints : [],
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
  pitchType: 'cover_letter' | 'cold_email' | 'linkedin_dm' = 'cover_letter',
  customApiKey?: string
): Promise<string> {
  const { client, model } = getGenAIClient(customApiKey);

  let styleGuide = '';
  if (pitchType === 'cover_letter') {
    styleGuide = 'Write a concise, compelling 3-paragraph cover letter. Avoid generic clichés. Directly cite specific achievements from the candidate resume that map to this role.';
  } else if (pitchType === 'cold_email') {
    styleGuide = 'Write a crisp, high-converting cold email (under 150 words) to a hiring manager or engineering lead. Include a catchy subject line.';
  } else {
    styleGuide = 'Write a polite, impactful LinkedIn direct message (under 100 words) to connect with a recruiter or engineering manager regarding this opening.';
  }

  const prompt = `You are a high-craft executive job search strategist.
${styleGuide}

CANDIDATE:
Name: ${profile.name}
Resume & Background:
${profile.resumeText}
Skills: ${profile.skills.join(', ')}

TARGET JOB:
Role: ${job.title} at ${job.company}
Job Description:
${job.description.slice(0, 3000)}

Output ONLY the text of the message/pitch. Do not wrap in markdown quotes.`;

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
  const { client, model } = getGenAIClient(customApiKey);

  const prompt = `Extract structured job posting details from the scraped text below.
Source URL: ${sourceUrl}

Raw Content:
${rawContent.slice(0, 6000)}

Respond strictly in JSON matching this schema:
{
  "title": "exact job title",
  "company": "company name",
  "location": "location (e.g., Remote, San Francisco CA, London UK)",
  "remoteType": "remote" | "hybrid" | "onsite" | "unknown",
  "salary": "salary range if mentioned, or empty string",
  "department": "department or team name if mentioned",
  "requirements": ["requirement 1", "requirement 2", ...],
  "description": "clean, well-formatted markdown of the job description, responsibilities, and requirements"
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
      location: parsed.location || 'Remote',
      remoteType: parsed.remoteType || 'unknown',
      salary: parsed.salary || undefined,
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
      location: 'Remote',
      description: rawContent.slice(0, 1500),
      url: sourceUrl,
    };
  }
}
