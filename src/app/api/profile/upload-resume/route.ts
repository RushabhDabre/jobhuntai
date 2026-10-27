import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getAppSettings, getUserProfile, saveUserProfile } from '@/lib/storage';
import { parseApiError } from '@/lib/apiErrorHandler';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const userId = (formData.get('userId') as string) || req.headers.get('x-user-id') || undefined;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const settings = await getAppSettings();
    const userProfile = userId ? await getUserProfile(userId) : null;
    const apiKey = userProfile?.geminiApiKey || settings.geminiApiKey || process.env.GEMINI_API_KEY;

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

    const systemPrompt = `You are an expert HR Tech recruiter and ATS resume parser specializing in the Indian software engineering market (Pune, Mumbai, Hyderabad, Bengaluru, Gurgaon).
Extract all key profile data from the uploaded resume file accurately into strict JSON with the following structure:
{
  "name": "Candidate Full Name",
  "email": "Email address if present",
  "phone": "Phone number if present",
  "currentLocation": "City and State if present (e.g. Pune, Maharashtra)",
  "yearsOfExperience": 3,
  "targetTitles": ["Software Developer", "Frontend Developer", "React Developer"],
  "skills": ["React", "JavaScript", "TypeScript", "Node.js", "Java", "SQL"],
  "currentCtc": "₹X LPA if mentioned or empty string",
  "expectedCtc": "₹Y LPA if mentioned or empty string",
  "noticePeriod": "Immediate Joiner / 15 Days / 30 Days / 60 Days / 90 Days",
  "cleanResumeMarkdown": "Clean markdown summary of candidate work experience, key achievements, and technologies used."
}
Be precise. If experience years are not explicitly stated, calculate from first job to present.`;

    const promptContents = [
      {
        text: systemPrompt,
      },
      {
        inlineData: {
          mimeType,
          data: buffer.toString('base64'),
        },
      },
    ];

    const response = await client.models.generateContent({
      model,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contents: promptContents as any,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    const updatedProfile = await saveUserProfile(
      {
        name: parsed.name || userProfile?.name || 'Candidate',
        email: parsed.email || userProfile?.email || undefined,
        phone: parsed.phone || userProfile?.phone || undefined,
        currentLocation: parsed.currentLocation || userProfile?.currentLocation || 'Pune, India',
        yearsOfExperience: Number(parsed.yearsOfExperience) || userProfile?.yearsOfExperience || 2,
        targetTitles: Array.isArray(parsed.targetTitles) && parsed.targetTitles.length > 0
          ? parsed.targetTitles
          : userProfile?.targetTitles || ['Software Developer', 'React Developer'],
        skills: Array.isArray(parsed.skills) && parsed.skills.length > 0 ? parsed.skills : userProfile?.skills || [],
        resumeText: parsed.cleanResumeMarkdown || buffer.toString('utf-8', 0, 3000),
        resumeFileName: file.name,
        updatedAt: new Date().toISOString(),
      },
      userId
    );

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
