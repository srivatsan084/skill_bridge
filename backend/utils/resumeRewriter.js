/**
 * SkillBridge AI Resume Rewriter Utility
 * Powered by Google Gemini API using the official @google/genai SDK (Interactions API & gemini-3.1-flash-lite).
 * Refines wording, action verbs, and ATS presentation without fabricating qualifications or metrics.
 */

const { GoogleGenAI } = require('@google/genai');

/**
 * Custom error for missing configuration
 */
class GeminiConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GeminiConfigError';
    this.code = 'CONFIG_MISSING';
    this.statusCode = 503;
  }
}

/**
 * Extracts raw textual output from Google Gemini Interactions API or models API response
 * @param {object} response
 * @returns {string}
 */
function extractResponseText(response) {
  if (!response) {
    return '';
  }

  // 1. Primary Interactions API output text field (populated by @google/genai SDK)
  if (typeof response.output_text === 'string' && response.output_text.trim().length > 0) {
    return response.output_text.trim();
  }

  // 2. Direct inspection of interaction steps (if output_text was not concatenated)
  if (Array.isArray(response.steps)) {
    for (let i = response.steps.length - 1; i >= 0; i--) {
      const step = response.steps[i];
      if (step && step.type === 'model_output' && Array.isArray(step.content)) {
        for (let j = step.content.length - 1; j >= 0; j--) {
          const item = step.content[j];
          if (item && item.type === 'text' && typeof item.text === 'string' && item.text.trim()) {
            return item.text.trim();
          }
        }
      }
    }
  }

  // 3. Fallback compatibility with models.generateContent format
  if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
    return response.candidates[0].content.parts[0].text.trim();
  }

  if (typeof response.text === 'string' && response.text.trim().length > 0) {
    return response.text.trim();
  }

  return '';
}

/**
 * Validates and extracts JSON from AI response text
 * Handles markdown-fenced JSON blocks (```json ... ```) safely and cleans stray surrounding text
 * @param {string} rawText
 * @returns {object}
 */
function parseAndValidateJsonResponse(rawText) {
  if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
    throw new Error('Empty response received from AI model.');
  }

  // Remove markdown code fences if present
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }

  // If leading or trailing conversational chatter is present, isolate the outer JSON object
  if (!cleaned.startsWith('{')) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1).trim();
    }
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (parseErr) {
    throw new Error(`Failed to parse AI response as JSON: ${parseErr.message}`);
  }

  // Structural sanity check
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Invalid AI response structure: expected a JSON object.');
  }

  return parsed;
}

/**
 * Normalizes project objects from various AI output formats to the standard schema
 * @param {Array} rawProjects
 * @returns {Array}
 */
function normalizeImprovedProjects(rawProjects) {
  if (!Array.isArray(rawProjects)) return [];

  return rawProjects
    .map((p) => {
      if (!p || typeof p !== 'object') return null;

      const originalTitle =
        p.originalTitle || p.name || p.title || p.projectTitle || 'Technical Project';
      const improvedTitle = p.improvedTitle || p.title || p.name || originalTitle;

      let originalPoints = [];
      if (Array.isArray(p.originalPoints)) {
        originalPoints = p.originalPoints.map((pt) => String(pt).trim()).filter(Boolean);
      } else if (typeof p.description === 'string' && p.description.trim()) {
        originalPoints = [p.description.trim()];
      }

      let improvedPoints = [];
      if (Array.isArray(p.improvedPoints)) {
        improvedPoints = p.improvedPoints.map((pt) => String(pt).trim()).filter(Boolean);
      } else if (Array.isArray(p.bulletPoints)) {
        improvedPoints = p.bulletPoints.map((pt) => String(pt).trim()).filter(Boolean);
      } else if (Array.isArray(p.keyAchievements)) {
        improvedPoints = p.keyAchievements.map((pt) => String(pt).trim()).filter(Boolean);
      } else if (Array.isArray(p.bullets)) {
        improvedPoints = p.bullets.map((pt) => String(pt).trim()).filter(Boolean);
      }

      let skillsUsed = [];
      if (Array.isArray(p.skillsUsed)) {
        skillsUsed = p.skillsUsed.map((s) => String(s).trim()).filter(Boolean);
      } else if (Array.isArray(p.techStack)) {
        skillsUsed = p.techStack.map((s) => String(s).trim()).filter(Boolean);
      } else if (Array.isArray(p.technologies)) {
        skillsUsed = p.technologies.map((s) => String(s).trim()).filter(Boolean);
      } else if (Array.isArray(p.skills)) {
        skillsUsed = p.skills.map((s) => String(s).trim()).filter(Boolean);
      }

      return {
        originalTitle,
        improvedTitle,
        originalPoints,
        improvedPoints: improvedPoints.length > 0 ? improvedPoints : originalPoints,
        skillsUsed
      };
    })
    .filter(Boolean);
}

/**
 * Normalizes work experience items to the standard schema
 * @param {Array} rawExp
 * @returns {Array}
 */
function normalizeImprovedExperience(rawExp) {
  if (!Array.isArray(rawExp)) return [];

  return rawExp
    .map((exp) => {
      if (!exp || typeof exp !== 'object') return null;
      const originalRole = exp.originalRole || exp.role || exp.title || '';
      const improvedRole = exp.improvedRole || originalRole;
      const originalCompany = exp.originalCompany || exp.company || exp.organization || '';

      let improvedPoints = [];
      if (Array.isArray(exp.improvedPoints)) {
        improvedPoints = exp.improvedPoints.map((pt) => String(pt).trim()).filter(Boolean);
      } else if (Array.isArray(exp.bulletPoints)) {
        improvedPoints = exp.bulletPoints.map((pt) => String(pt).trim()).filter(Boolean);
      }

      return {
        originalRole,
        improvedRole,
        originalCompany,
        improvedPoints
      };
    })
    .filter(Boolean);
}

/**
 * Normalizes skills presentation categories to the standard schema
 * @param {object} rawSkills
 * @returns {object}
 */
function normalizeSkillsPresentation(rawSkills) {
  if (!rawSkills || typeof rawSkills !== 'object') {
    return { categorizedSkills: [], presentationTips: '' };
  }

  let categorizedSkills = [];
  if (Array.isArray(rawSkills.categorizedSkills)) {
    categorizedSkills = rawSkills.categorizedSkills
      .map((cat) => ({
        category: cat.category || 'Technical Skills',
        skills: Array.isArray(cat.skills)
          ? cat.skills.map((s) => String(s).trim()).filter(Boolean)
          : []
      }))
      .filter((cat) => cat.skills.length > 0);
  } else {
    // If the model returned an object mapping category name -> skills array
    categorizedSkills = Object.entries(rawSkills)
      .filter(([key, val]) => key !== 'presentationTips' && Array.isArray(val) && val.length > 0)
      .map(([key, val]) => ({
        category: key,
        skills: val.map((s) => String(s).trim()).filter(Boolean)
      }));
  }

  return {
    categorizedSkills,
    presentationTips:
      typeof rawSkills.presentationTips === 'string' ? rawSkills.presentationTips.trim() : ''
  };
}

/**
 * Generates an AI-powered resume rewrite grounded strictly in existing facts
 * Uses Google Gemini Interactions API with gemini-3.1-flash-lite by default.
 *
 * @param {object} params
 * @param {string} params.resumeText - Plain text extracted from the student resume
 * @param {string} params.targetRole - Target career goal (e.g. "Full Stack Developer")
 * @param {string[]} [params.extractedSkills] - Skills identified in the student resume
 * @param {Array} [params.matchedSkills] - Skills matching industry postings
 * @param {Array} [params.missingSkills] - Industry skills missing from the resume
 * @returns {Promise<object>} Structured rewrite result
 */
async function generateResumeRewrite({
  resumeText,
  targetRole,
  extractedSkills = [],
  matchedSkills = [],
  missingSkills = []
}) {
  const apiKey = process.env.GEMINI_API_KEY;

  // Read GEMINI_MODEL exclusively from environment variables, defaulting to gemini-3.1-flash-lite
  // Uses configured model directly without automatic legacy rewriting
  const modelName = (process.env.GEMINI_MODEL || '').trim() || 'gemini-3.1-flash-lite';

  if (!apiKey || apiKey.trim().length === 0) {
    throw new GeminiConfigError(
      'Google Gemini API key is not configured. Please set GEMINI_API_KEY in the backend environment (.env) to enable AI resume rewriting.'
    );
  }

  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 20) {
    const textError = new Error(
      'Resume content is too short or empty. Please upload a valid resume with readable text content.'
    );
    textError.statusCode = 400;
    throw textError;
  }

  const cleanRole = (targetRole || 'Software Engineer').trim();

  // Initialize official Google GenAI client
  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `You are an expert technical resume coach specializing in engineering students.
Your mission is to improve the clarity, professional tone, action-oriented wording, and ATS readability of an engineering student's existing resume tailored specifically for the target role: "${cleanRole}".

CRITICAL NON-FABRICATION RULES (MANDATORY & ABSOLUTE):
1. GROUNDED IN TRUTH: Use ONLY facts, qualifications, and achievements explicitly mentioned in the student's resume.
2. NO FICTIONAL METRICS: NEVER invent numbers, percentages, user counts, latency drops, or metrics (e.g. do NOT invent "improved performance by 40%" or "used by 10,000 users").
3. NO FICTIONAL HISTORY: NEVER invent companies, internships, degrees, certifications, or clubs that do not exist in the resume text.
4. NO SKILL INVENTING: NEVER claim the student knows a skill simply because it is in demand for the target role. Only highlight skills the student actually stated they used.
5. PRESERVE INTENT: Maintain the authentic scope of student projects. Use strong action verbs (e.g. "Architected", "Engineered", "Implemented", "Developed", "Containerized") while staying true to the student's work.
6. NO SUMMARY IF MISSING: If the student did NOT write an existing summary or objective, set professionalSummary.hasOriginalSummary to false and do not invent one.
7. NO EXPERIENCE IF MISSING: If the student is a sophomore/junior with no prior internships or job experience, leave improvedExperience as an empty array [].
8. IDENTIFY PROJECTS THOROUGHLY: Carefully scan the resume for ALL personal, academic, hackathon, and course projects (look for headings like "Projects", "Academic Projects", "Key Projects", or project titles with delimiters like "Project Name | Subtitle"). For EVERY project found, create an entry in improvedProjects. DO NOT return an empty improvedProjects array if projects exist in the resume text.
9. IDENTIFY GAPS CONSTRUCTIVELY: In suggestionsForMissingInfo, constructively point out what real details (e.g. measurable project outcomes, testing frameworks, deployment links) the student could provide to strengthen their resume for "${cleanRole}".

You must return a valid JSON object matching the following structure:
{
  "targetRole": "${cleanRole}",
  "professionalSummary": {
    "hasOriginalSummary": true or false,
    "improvedSummary": "Polished professional summary (if original was present) or empty string",
    "summaryNotes": "Brief tip on professional summary positioning for ${cleanRole}"
  },
  "improvedProjects": [
    {
      "originalTitle": "Original project name from resume",
      "improvedTitle": "Clear, professional project title tailored for ${cleanRole}",
      "originalPoints": ["Original bullet or description point"],
      "improvedPoints": ["Action-oriented, ATS-optimized bullet point with strong technical verbs"],
      "skillsUsed": ["Technologies explicitly mentioned in this project"]
    }
  ],
  "improvedExperience": [
    {
      "originalRole": "Original role/title (if any)",
      "improvedRole": "Refined role title",
      "originalCompany": "Company/Organization name",
      "improvedPoints": ["Refined, impact-focused bullet points"]
    }
  ],
  "improvedSkillsPresentation": {
    "categorizedSkills": [
      {
        "category": "e.g. Languages / Frontend / Backend & Databases / Developer Tools",
        "skills": ["Skills from student resume organized logically"]
      }
    ],
    "presentationTips": "Guidance on formatting skills for ${cleanRole} ATS scanners"
  },
  "suggestionsForMissingInfo": [
    "Specific, constructive suggestions on what real information the student could add"
  ],
  "verificationWarning": "Please review and verify all generated wording before adding it to your resume. The AI improves phrasing but cannot verify factual accuracy. Never claim skills or achievements you have not performed."
}`;

  const userPrompt = `TARGET CAREER ROLE: ${cleanRole}

STUDENT EXTRACTED RESUME TEXT:
"""
${resumeText}
"""

MATCHED INDUSTRY SKILLS FOR ${cleanRole}:
${matchedSkills.map((s) => s.skill || s).join(', ') || 'None specified'}

INDUSTRY SKILLS TO KEEP IN MIND (DO NOT FABRICATE):
${missingSkills.slice(0, 8).map((s) => s.skill || s).join(', ') || 'None'}

PROJECT EXTRACTION DIRECTIVE:
Identify and rewrite EVERY project found in the resume text above (such as hackathon entries, course projects, hardware/IoT systems, web applications). Do not skip any project. Align the bullet points to highlight skills relevant to ${cleanRole}.

Please provide the structured resume rewrite strictly following all non-fabrication rules. Output valid JSON only.`;

  try {
    let candidateText = '';

    // Invoke Gemini using the official Interactions API with JSON response format
    if (ai.interactions && typeof ai.interactions.create === 'function') {
      const interactionResponse = await ai.interactions.create({
        model: modelName,
        input: userPrompt,
        system_instruction: systemInstruction,
        response_format: {
          type: 'text',
          mime_type: 'application/json'
        }
      });
      candidateText = extractResponseText(interactionResponse);
    } else {
      // Fallback to models.generateContent if interactions client is unavailable in the environment
      const modelsResponse = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }]
          }
        ],
        config: {
          systemInstruction,
          responseMimeType: 'application/json'
        }
      });
      candidateText = extractResponseText(modelsResponse);
    }

    if (!candidateText) {
      throw new Error('No readable output text returned by Google Gemini model.');
    }

    const validatedResult = parseAndValidateJsonResponse(candidateText);

    const normalizedProjects = normalizeImprovedProjects(validatedResult.improvedProjects);
    const normalizedExperience = normalizeImprovedExperience(validatedResult.improvedExperience);
    const normalizedSkills = normalizeSkillsPresentation(validatedResult.improvedSkillsPresentation);

    return {
      targetRole: cleanRole,
      professionalSummary: {
        hasOriginalSummary: Boolean(validatedResult.professionalSummary?.hasOriginalSummary),
        improvedSummary: validatedResult.professionalSummary?.improvedSummary || '',
        summaryNotes: validatedResult.professionalSummary?.summaryNotes || ''
      },
      improvedProjects: normalizedProjects,
      improvedExperience: normalizedExperience,
      improvedSkillsPresentation: normalizedSkills,
      suggestionsForMissingInfo: Array.isArray(validatedResult.suggestionsForMissingInfo)
        ? validatedResult.suggestionsForMissingInfo.map((s) => String(s).trim()).filter(Boolean)
        : [],
      verificationWarning:
        validatedResult.verificationWarning ||
        'Please review and verify all generated wording before adding it to your resume. The AI improves phrasing but cannot verify factual accuracy. Never claim skills or achievements you have not performed.',
      modelUsed: modelName,
      generatedAt: new Date()
    };
  } catch (err) {
    if (err instanceof GeminiConfigError || err.code === 'CONFIG_MISSING') {
      throw err;
    }

    // Handle high demand or service unavailability (503)
    if (
      err.status === 503 ||
      err.statusCode === 503 ||
      err.message?.includes('503') ||
      err.message?.includes('high demand') ||
      err.message?.includes('UNAVAILABLE')
    ) {
      const highDemandError = new Error(
        `Google Gemini (${modelName}) is currently experiencing high demand. Please try again in a moment.`
      );
      highDemandError.statusCode = 503;
      highDemandError.code = 'HIGH_DEMAND';
      throw highDemandError;
    }

    // Handle Gemini rate limits or quota errors
    if (
      err.status === 429 ||
      err.statusCode === 429 ||
      err.message?.includes('429') ||
      err.message?.includes('RESOURCE_EXHAUSTED') ||
      err.message?.includes('quota')
    ) {
      const rateLimitError = new Error(
        'Gemini AI quota or rate limit exceeded. Please wait a moment and try again.'
      );
      rateLimitError.statusCode = 429;
      rateLimitError.code = 'RATE_LIMIT_EXCEEDED';
      throw rateLimitError;
    }

    // Handle authentication / invalid key errors from Google
    if (
      err.status === 401 ||
      err.statusCode === 401 ||
      err.status === 403 ||
      err.message?.includes('API_KEY_INVALID') ||
      err.message?.includes('401')
    ) {
      const authError = new Error(
        'Invalid Google Gemini API key. Please check the GEMINI_API_KEY value in backend/.env.'
      );
      authError.statusCode = 401;
      authError.code = 'INVALID_API_KEY';
      throw authError;
    }

    // Handle model deprecation / 404
    if (
      err.status === 404 ||
      err.statusCode === 404 ||
      err.message?.includes('404') ||
      err.message?.includes('no longer available')
    ) {
      const modelError = new Error(
        `Gemini model "${modelName}" is not available. Please verify GEMINI_MODEL in backend/.env is set to "gemini-3.1-flash-lite".`
      );
      modelError.statusCode = 404;
      modelError.code = 'MODEL_NOT_FOUND';
      throw modelError;
    }

    // General API timeout or fetch failure
    const generalError = new Error(
      `Gemini AI generation failed: ${err.message || 'Unknown network error'}`
    );
    generalError.statusCode = 502;
    generalError.code = 'AI_GATEWAY_ERROR';
    throw generalError;
  }
}

module.exports = {
  generateResumeRewrite,
  parseAndValidateJsonResponse,
  extractResponseText,
  normalizeImprovedProjects,
  normalizeImprovedExperience,
  normalizeSkillsPresentation,
  GeminiConfigError
};
