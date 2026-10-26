import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getAppSettings, saveUserProfile } from '@/lib/storage';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const settings = getAppSettings();
    const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Gemini API key is required to parse resumes. Please add it in Settings (Gear Icon) first.',
        },
        { status: 400 }
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
  "currentLocation": "City, India (e.g. Bengaluru, Pune, Hyderabad, Delhi NCR, Mumbai)",
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
  "currentLocation": "City, India (e.g. Bengaluru, Pune, Hyderabad, Delhi NCR, Mumbai)",
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

    const updatedProfile = saveUserProfile({
      name: parsed.name || 'Candidate',
      email: parsed.email || undefined,
      phone: parsed.phone || undefined,
      currentLocation: parsed.currentLocation || 'Bengaluru, India',
      yearsOfExperience: Number(parsed.yearsOfExperience) || 3,
      targetTitles: Array.isArray(parsed.targetTitles) && parsed.targetTitles.length > 0
        ? parsed.targetTitles
        : ['Full Stack Engineer', 'SDE 2'],
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
    const message = error instanceof Error ? error.message : 'Failed to parse resume file';
    console.error('Resume upload error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
