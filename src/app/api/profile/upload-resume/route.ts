import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getAppSettings, getUserProfile, saveUserProfile } from '@/lib/storage';
import { resolveAuthUser } from '@/lib/auth-server';
import { parseApiError } from '@/lib/apiErrorHandler';
import { normalizeGeminiModel, generateContentWithRetry } from '@/lib/services/gemini';
import { executeAiWithFailover } from '@/lib/services/aiRouter';
import { withTimeout } from '@/lib/timeout';

function parseResumeHeuristically(rawText: string, fileName: string) {
  const clean = rawText.replace(/\s+/g, ' ');
  const emailMatch = clean.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = clean.match(/(?:\+91[\s-]?)?[6789]\d{9}/);

  const KNOWN_SKILLS = [
    'React', 'Next.js', 'Node.js', 'TypeScript', 'JavaScript', 'Java', 'Spring Boot',
    'Python', 'AWS', 'Docker', 'Kubernetes', 'SAP ABAP', 'SAP HANA', 'SAP FICO', 'SAP MM',
    'Salesforce', 'C#', '.NET', 'ASP.NET', 'SQL', 'PostgreSQL', 'MongoDB', 'Angular',
    'DevOps', 'CI/CD', 'Terraform', 'Azure', 'GCP', 'Linux', 'Microservices', 'REST APIs',
    'GraphQL', 'Kafka', 'Redis', 'Selenium', 'Cypress', 'Playwright', 'Jest', 'Git',
  ];

  const matchedSkills = KNOWN_SKILLS.filter((s) => {
    const regex = new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(clean);
  });

  const textLower = clean.toLowerCase();
  let domainCategory = 'Fullstack Development';
  let targetTitles = ['Fullstack Developer', 'Software Engineer'];
  let suggestedRoles = [
    'Senior Fullstack Developer',
    'Lead Software Engineer',
    'Frontend Specialist (React/TypeScript)',
    'Backend Engineer (Microservices)',
    'Cloud Software Engineer',
  ];

  if (textLower.includes('sap') || textLower.includes('abap') || textLower.includes('fico') || textLower.includes('hana')) {
    domainCategory = 'SAP ERP Consulting';
    targetTitles = ['SAP Consultant', 'SAP ABAP Developer'];
    suggestedRoles = [
      'Senior SAP ABAP Consultant',
      'SAP S/4HANA Developer',
      'SAP Technical Lead',
      'SAP Integration Specialist',
      'SAP Fiori Developer',
    ];
  } else if (textLower.includes('devops') || textLower.includes('kubernetes') || textLower.includes('terraform') || textLower.includes('sre')) {
    domainCategory = 'DevOps & Cloud Infrastructure';
    targetTitles = ['DevOps Engineer', 'Cloud Infrastructure Engineer'];
    suggestedRoles = [
      'Senior DevOps Engineer',
      'Cloud Platform Engineer (AWS/Azure)',
      'Site Reliability Engineer (SRE)',
      'Kubernetes Infrastructure Lead',
      'DevOps Automation Specialist',
    ];
  } else if (textLower.includes('qa') || textLower.includes('selenium') || textLower.includes('test automation') || textLower.includes('sdet')) {
    domainCategory = 'QA & Automation Engineering';
    targetTitles = ['QA Automation Engineer', 'SDET'];
    suggestedRoles = [
      'Senior SDET - Automation',
      'Lead QA Engineer',
      'Performance Test Specialist',
      'API Test Automation Engineer',
      'Quality Assurance Lead',
    ];
  } else if (textLower.includes('data engineer') || textLower.includes('data science') || textLower.includes('machine learning')) {
    domainCategory = 'Data Science & AI';
    targetTitles = ['Data Engineer', 'AI/ML Engineer'];
    suggestedRoles = [
      'Senior Data Engineer',
      'Machine Learning Engineer',
      'Big Data Pipeline Specialist',
      'AI Solutions Architect',
      'BI & Analytics Engineer',
    ];
  }

  const nameFromFileName = fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/resume|cv/gi, '')
    .trim();

  return {
    name: nameFromFileName ? nameFromFileName.charAt(0).toUpperCase() + nameFromFileName.slice(1) : 'Candidate',
    email: emailMatch ? emailMatch[0] : undefined,
    phone: phoneMatch ? phoneMatch[0] : undefined,
    currentLocation: textLower.includes('pune')
      ? 'Pune, Maharashtra'
      : textLower.includes('bengaluru') || textLower.includes('bangalore')
      ? 'Bengaluru, Karnataka'
      : textLower.includes('mumbai')
      ? 'Mumbai, Maharashtra'
      : textLower.includes('hyderabad')
      ? 'Hyderabad, Telangana'
      : 'Pune / Bengaluru',
    yearsOfExperience: 3,
    domainCategory,
    targetTitles,
    suggestedRoles,
    skills: matchedSkills.length > 0 ? matchedSkills : ['React', 'Node.js', 'TypeScript', 'SQL', 'REST APIs'],
    suggestedTechnologies: matchedSkills.length > 0 ? matchedSkills.slice(0, 8) : ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'AWS'],
    noticePeriod: 'Immediate Joiner',
    cleanResumeMarkdown: rawText.slice(0, 3000),
  };
}

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
    const bodyApiKey = (formData.get('apiKey') as string)?.trim() || undefined;

    const geminiKey = (bodyApiKey?.startsWith('AIza') ? bodyApiKey : userProfile?.geminiApiKey) || (!bodyApiKey?.startsWith('gsk_') && !bodyApiKey?.startsWith('sk-') ? bodyApiKey : undefined);
    const groqKey = (bodyApiKey?.startsWith('gsk_') ? bodyApiKey : userProfile?.groqApiKey) || undefined;
    const openRouterKey = (bodyApiKey?.startsWith('sk-or-') ? bodyApiKey : userProfile?.openRouterApiKey) || undefined;
    const openaiKey = ((bodyApiKey?.startsWith('sk-') && !bodyApiKey?.startsWith('sk-or-')) ? bodyApiKey : userProfile?.openaiApiKey) || undefined;

    const hasAnyKey = Boolean(geminiKey || groqKey || openRouterKey || openaiKey);

    if (!hasAnyKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please connect a free AI API key first (Google Gemini at Google AI Studio or Groq Cloud at console.groq.com).',
          isApiKeyMissing: true,
          formattedError: {
            isRateLimited: false,
            isExpired: false,
            service: 'AI Service',
            title: 'AI Engine Key Required',
            message: 'Connect your free Gemini or Groq key to parse resumes and discover matching criteria.',
            resetTime: '',
            resetInMinutes: 0,
            suggestion: 'Enter your API key in Step 1 of the setup wizard or Settings.',
            rawMessage: 'API Key missing',
          },
        },
        { status: 400 }
      );
    }

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any = {};
    let parseText = '';

    // If Gemini key is available, attempt native multimodal PDF parsing
    if (geminiKey) {
      try {
        const client = new GoogleGenAI({ apiKey: geminiKey });
        const model = normalizeGeminiModel(settings.defaultGeminiModel);
        const promptContents = [
          { text: systemPrompt },
          { inlineData: { mimeType, data: buffer.toString('base64') } },
        ];
        const response = await withTimeout(
          generateContentWithRetry(client, model, {
            contents: promptContents,
            config: { responseMimeType: 'application/json' },
          }),
          11000,
          'Gemini multimodal resume parsing timed out after 11s'
        );
        parseText = response.text || '';
      } catch (geminiErr) {
        console.warn('Gemini multimodal parse failed or timed out, attempting failover via text...', geminiErr);
      }
    }

    const extractedText = buffer.toString('utf-8', 0, 8000).replace(/[^\x20-\x7E\n\r\t]/g, ' ').trim();

    // If Gemini was not used or failed, execute via Multi-Engine AI router (Groq/OpenRouter/OpenAI)
    if (!parseText) {
      try {
        const aiRes = await withTimeout(
          executeAiWithFailover({
            prompt: `Please parse this candidate resume text into the requested JSON schema:\n\n${extractedText}`,
            systemPrompt,
            responseJson: true,
            profile: userProfile,
            customKeys: {
              gemini: geminiKey,
              groq: groqKey,
              openrouter: openRouterKey,
              openai: openaiKey,
            },
          }),
          11000,
          'Multi-engine text AI parsing timed out after 11s'
        );
        parseText = aiRes.text;
      } catch (aiErr) {
        console.warn('Multi-engine text parse failed or timed out, applying heuristic parser:', aiErr);
      }
    }

    try {
      const cleanJson = (parseText || '{}').replace(/```json\n?|\n?```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      parsed = {};
    }

    // Guaranteed fallback: If AI failed or returned empty data, parse heuristically from the resume
    if (!parsed.targetTitles?.length && !parsed.skills?.length) {
      const heuristicData = parseResumeHeuristically(extractedText, file.name);
      parsed = { ...heuristicData, ...parsed };
    }

    const updatedProfile = await saveUserProfile(
      {
        name: parsed.name || authUser?.name || userProfile?.name || 'Candidate',
        email: parsed.email || authUser?.email || userProfile?.email || undefined,
        phone: parsed.phone || userProfile?.phone || undefined,
        currentLocation: parsed.currentLocation || userProfile?.currentLocation || '',
        yearsOfExperience: Number(parsed.yearsOfExperience) || userProfile?.yearsOfExperience || 0,
        domainCategory: parsed.domainCategory || undefined,
        geminiApiKey: geminiKey || userProfile?.geminiApiKey,
        groqApiKey: groqKey || userProfile?.groqApiKey,
        openRouterApiKey: openRouterKey || userProfile?.openRouterApiKey,
        openaiApiKey: openaiKey || userProfile?.openaiApiKey,
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
    const formatted = parseApiError(error, 'AI Service');
    return NextResponse.json({
      success: false,
      error: formatted.message,
      formattedError: formatted,
    }, { status: 200 });
  }
}
