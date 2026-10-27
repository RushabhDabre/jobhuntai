import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getAppSettings, saveUserProfile } from '@/lib/storage';
import { parseApiError } from '@/lib/apiErrorHandler';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const settings = await getAppSettings();
    const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      const now = new Date();
      const resetTimeStr = new Date(now.getTime() + 15 * 60 * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Gemini API key is missing. Please configure it in Settings (Gear Icon).',
          formattedError: {
            isRateLimited: false,
            isExpired: true,
            service: 'Gemini',
            title: 'API Key Missing',
            message: 'A Gemini API key is needed to parse resumes. Free keys are available from Google AI Studio.',
            resetTime: resetTimeStr,
            resetInMinutes: 0,
            suggestion: 'Click Settings in the top-right to add your key.',
            rawMessage: 'Missing API key',
          },
        },
        { status: 200 }
      );
    }

    const client = new GoogleGenAI({ apiKey });
    const model = settings.defaultGeminiModel || 'gemini-2.5-flash';

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'application/pdf';

    let promptContents: unknown[];

    if (mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const base64Data = buffer.toString('base64');
      promptContents = [
        {
          inlineData: {
            data: base64Data,
            mimeType: 'application/pdf',
          },
        },
        `You are an expert technical recruiter analyzing a candidate's resume for the Indian tech industry.
Extract and structure the candidate's profile into JSON.

Respond strictly in valid JSON matching this schema:
{
  "name": "Full Name",
  "email": "email address or empty string",
  "phone": "phone number or empty string",
  "currentLocation": "City, India (e.g. Pune, Mumbai, Hyderabad, Bengaluru, Delhi NCR)",
  "yearsOfExperience": number (total years of professional software/tech experience as float or int),
  "targetTitles": ["Target Title 1", "Target Title 2", ...],
  "skills": ["Skill 1", "Skill 2", "Skill 3", ...],
  "cleanResumeMarkdown": "Full, well-formatted markdown transcription of this resume including Summary, Work Experience, Education, Projects, and Skills."
}`,
      ];
    } else {
      // Plain text or markdown
      const textContent = buffer.toString('utf-8');
      promptContents = [
        `You are an expert technical recruiter analyzing a candidate's resume for the Indian tech industry.
Extract and structure the candidate's profile into JSON from this text:

${textContent.slice(0, 8000)}

Respond strictly in valid JSON matching this schema:
{
  "name": "Full Name",
  "email": "email address or empty string",
  "phone": "phone number or empty string",
  "currentLocation": "City, India (e.g. Pune, Mumbai, Hyderabad, Bengaluru, Delhi NCR)",
  "yearsOfExperience": number (total years of professional software/tech experience),
  "targetTitles": ["Target Title 1", "Target Title 2", ...],
  "skills": ["Skill 1", "Skill 2", "Skill 3", ...],
  "cleanResumeMarkdown": "Clean markdown representation of the resume"
}`,
      ];
    }

    const response = await client.models.generateContent({
      model,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contents: promptContents as any,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    const updatedProfile = await saveUserProfile({
      name: parsed.name || 'Candidate',
      email: parsed.email || undefined,
      phone: parsed.phone || undefined,
      currentLocation: parsed.currentLocation || 'Pune, India',
      yearsOfExperience: Number(parsed.yearsOfExperience) || 3,
      targetTitles: Array.isArray(parsed.targetTitles) && parsed.targetTitles.length > 0
        ? parsed.targetTitles
        : ['Software Developer', 'React Developer'],
      skills: Array.isArray(parsed.skills) && parsed.skills.length > 0 ? parsed.skills : [],
      resumeText: parsed.cleanResumeMarkdown || buffer.toString('utf-8', 0, 3000),
      resumeFileName: file.name,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      message: `Successfully parsed and synced resume from ${file.name}`,
    });
  } catch (error: unknown) {
    const formatted = parseApiError(error, 'Gemini');
    return NextResponse.json({
      success: false,
      error: formatted.message,
      formattedError: formatted,
    }, { status: 200 });
  }
}
