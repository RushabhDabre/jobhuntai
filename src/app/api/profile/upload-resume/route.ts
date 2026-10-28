import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getAppSettings, getUserProfile, saveUserProfile } from '@/lib/storage';
import { resolveAuthUser } from '@/lib/auth-server';
import { parseApiError } from '@/lib/apiErrorHandler';
import { normalizeGeminiModel } from '@/lib/services/gemini';

export async function POST(req: Request) {
  try {
    const authUser = await resolveAuthUser(req);
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const userId = authUser?.userId || (formData.get('userId') as string) || req.headers.get('x-user-id') || undefined;

    if (!userId || userId === 'default_user') {
      return NextResponse.json({ success: false, error: 'Authentication required. Please sign in.' }, { status: 401 });
    }

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const settings = await getAppSettings();
    const userProfile = userId ? await getUserProfile(userId) : null;
    const bodyApiKey = (formData.get('apiKey') as string) || undefined;
    const apiKey = bodyApiKey?.trim() || userProfile?.geminiApiKey?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please connect your personal Google Gemini API key first. Free keys are available at Google AI Studio with zero billing required.',
          isApiKeyMissing: true,
          formattedError: {
            isRateLimited: false,
            isExpired: false,
            service: 'Gemini',
            title: 'Gemini API Key Required',
            message: 'Each user connects their own free Google Gemini API key to ensure private, isolated AI usage without sharing quotas.',
            resetTime: '',
            resetInMinutes: 0,
            suggestion: 'Enter your API key in Step 1 of the setup wizard or Settings.',
            rawMessage: 'API Key missing',
          },
        },
        { status: 400 }
      );
    }

    const client = new GoogleGenAI({ apiKey });
    const model = normalizeGeminiModel(settings.defaultGeminiModel);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'application/pdf';

    const systemPrompt = `You are an expert HR Tech recruiter and ATS resume parser for the Indian tech and corporate hiring market (Pune, Mumbai, Hyderabad, Bengaluru, Delhi-NCR, Chennai).
Analyze this candidate's uploaded resume carefully. Identify their EXACT specialization, profession, and domain:
Examples:
- SAP (e.g. SAP ABAP Consultant, SAP FICO, SAP MM, SAP SD, SAP HANA Developer, SAP Basis, SAP S/4HANA)
- DevOps / Cloud / SRE (e.g. DevOps Engineer, Cloud Engineer, Site Reliability Engineer, Platform Engineer, Kubernetes/AWS Engineer)
- Fullstack / Frontend / Backend (e.g. React Developer, Node.js Engineer, Java Spring Boot Developer, .NET Core Developer, Python Developer)
- Salesforce (e.g. Salesforce Developer, Salesforce Administrator, Apex/LWC Specialist)
- Data Science / AI / ML / Data Engineering (e.g. Data Engineer, Data Scientist, ML Engineer, BI Analyst)
- QA / Testing / SDET (e.g. QA Automation Engineer, SDET, Performance Tester, Manual QA)
- Cyber Security (e.g. SOC Analyst, Security Engineer, Penetration Tester)
- Mobile (e.g. Flutter Developer, Android Developer, iOS Developer)

Extract all profile data into strict JSON with this exact structure:
{
  "name": "Candidate Full Name",
  "email": "Email address if present",
  "phone": "Phone number if present",
  "currentLocation": "City and State if present (e.g. Pune, Maharashtra)",
  "yearsOfExperience": 3,
  "domainCategory": "Exact domain e.g. 'DevOps & Cloud' or 'SAP ERP' or 'Fullstack Development' or 'QA Automation' or 'Data Engineering'",
  "targetTitles": ["Primary Job Title from Resume", "Secondary Equivalent Title"],
  "suggestedRoles": [
    "List of 5 to 8 realistic, high-demand job titles in India matching this candidate's EXACT domain (e.g. for SAP: 'SAP ABAP Consultant', 'SAP HANA Developer', 'SAP Technical Lead'; for DevOps: 'DevOps Engineer', 'Cloud Infrastructure Engineer', 'Kubernetes Administrator', 'SRE')"
  ],
  "skills": ["Key skills and frameworks extracted from the resume"],
  "suggestedTechnologies": [
    "List of 8 to 14 top primary technologies, tools, and platforms specific to this candidate's resume (e.g. for DevOps: 'Kubernetes', 'Docker', 'Terraform', 'AWS', 'Jenkins', 'Ansible'; for SAP: 'SAP ABAP', 'SAP S/4HANA', 'IDoc', 'BAPI', 'SAP Fiori', 'SAP MM')"
  ],
  "currentCtc": "₹X LPA if mentioned or empty string",
  "expectedCtc": "₹Y LPA if mentioned or empty string",
  "noticePeriod": "Immediate Joiner / 15 Days / 30 Days / 60 Days / 90 Days",
  "cleanResumeMarkdown": "Clean markdown summary of candidate work experience, key achievements, and technologies used."
}
Be precise. Calculate yearsOfExperience from first professional role to present.`;

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
        name: parsed.name || authUser?.name || userProfile?.name || 'Candidate',
        email: parsed.email || authUser?.email || userProfile?.email || undefined,
        phone: parsed.phone || userProfile?.phone || undefined,
        currentLocation: parsed.currentLocation || userProfile?.currentLocation || '',
        yearsOfExperience: Number(parsed.yearsOfExperience) || userProfile?.yearsOfExperience || 0,
        domainCategory: parsed.domainCategory || undefined,
        geminiApiKey: apiKey,
        targetTitles: Array.isArray(parsed.targetTitles) && parsed.targetTitles.length > 0
          ? parsed.targetTitles
          : Array.isArray(parsed.suggestedRoles) && parsed.suggestedRoles.length > 0
          ? parsed.suggestedRoles.slice(0, 3)
          : userProfile?.targetTitles || [],
        suggestedRoles: Array.isArray(parsed.suggestedRoles) ? parsed.suggestedRoles : [],
        preferredTechnologies: Array.isArray(parsed.suggestedTechnologies) && parsed.suggestedTechnologies.length > 0
          ? parsed.suggestedTechnologies.slice(0, 6)
          : Array.isArray(parsed.skills) && parsed.skills.length > 0
          ? parsed.skills.slice(0, 6)
          : userProfile?.preferredTechnologies || [],
        suggestedTechnologies: Array.isArray(parsed.suggestedTechnologies) ? parsed.suggestedTechnologies : [],
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
      domainCategory: parsed.domainCategory,
      targetTitles: updatedProfile.targetTitles,
      suggestedRoles: updatedProfile.suggestedRoles,
      preferredTechnologies: updatedProfile.preferredTechnologies,
      suggestedTechnologies: updatedProfile.suggestedTechnologies,
      skills: updatedProfile.skills,
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
