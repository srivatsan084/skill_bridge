/**
 * SkillBridge AI Resume Rewriter Utility
 * Powered by Google Gemini API using the official @google/genai SDK.
 * Refines wording, action verbs, and ATS presentation without fabricating qualifications or metrics.
 */

const { GoogleGenAI } = require('@google/genai');

/**
 * Validates and extracts JSON from AI response text
 * Handles markdown-fenced JSON blocks (```json ... ```) safely
 * @param {string} rawText
 * @returns {object}
 */
function parseAndValidateJsonResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty response received from AI model.');
  }

  // Remove markdown code fences if present
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (parseErr) {
    throw new Error(`Failed to parse AI response as JSON: ${parseErr.message}`);
  }

  // Structural sanity check
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid AI response structure: expected a JSON object.');
  }

  return parsed;
}

/**
 * Generates an AI-powered resume rewrite grounded strictly in existing facts
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
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey || apiKey.trim().length === 0) {
    const configError = new Error(
      'Google Gemini API key is not configured. Please set GEMINI_API_KEY in the backend environment (.env) to enable AI resume rewriting.'
    );
    configError.statusCode = 503;
    configError.code = 'CONFIG_MISSING';
    throw configError;
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
Your mission is to improve the clarity, professional tone, action-oriented wording, and ATS readability of an engineering student's existing resume for the target role: "${cleanRole}".

CRITICAL NON-FABRICATION RULES (MANDATORY & ABSOLUTE):
1. GROUNDED IN TRUTH: Use ONLY facts, qualifications, and achievements explicitly mentioned in the student's resume.
2. NO FICTIONAL METRICS: NEVER invent numbers, percentages, user counts, latency drops, or metrics (e.g. do NOT invent "improved performance by 40%" or "used by 10,000 users").
3. NO FICTIONAL HISTORY: NEVER invent companies, internships, degrees, certifications, or clubs that do not exist in the resume text.
4. NO SKILL INVENTING: NEVER claim the student knows a skill simply because it is in demand for the target role. Only highlight skills the student actually stated they used.
5. PRESERVE INTENT: Maintain the authentic scope of student projects. Use strong action verbs (e.g. "Architected", "Engineered", "Implemented", "Developed", "Containerized") while staying true to the student's work.
6. NO SUMMARY IF MISSING: If the student did NOT write an existing summary or objective, set professionalSummary.hasOriginalSummary to false and do not invent one.
7. NO EXPERIENCE IF MISSING: If the student is a sophomore/junior with no prior internships or job experience, leave improvedExperience as an empty array [].
8. IDENTIFY GAPS CONSTRUCTIVELY: In suggestionsForMissingInfo, constructively point out what real details (e.g. measurable project outcomes, testing frameworks, deployment links) the student could provide to strengthen their resume.

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
      "improvedTitle": "Clear, professional project title",
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

MATCHED INDUSTRY SKILLS FROM JOB POSTINGS:
${matchedSkills.map((s) => s.skill || s).join(', ') || 'None specified'}

INDUSTRY SKILLS TO KEEP IN MIND (DO NOT FABRICATE):
${missingSkills.slice(0, 8).map((s) => s.skill || s).join(', ') || 'None'}

Please provide the structured resume rewrite strictly following all non-fabrication rules. Output valid JSON only.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2 // Low temperature for high factual adherence
      }
    });

    const candidateText =
      response.candidates?.[0]?.content?.parts?.[0]?.text || response.text;

    const validatedResult = parseAndValidateJsonResponse(candidateText);

    return {
      targetRole: cleanRole,
      professionalSummary: {
        hasOriginalSummary: Boolean(validatedResult.professionalSummary?.hasOriginalSummary),
        improvedSummary: validatedResult.professionalSummary?.improvedSummary || '',
        summaryNotes: validatedResult.professionalSummary?.summaryNotes || ''
      },
      improvedProjects: Array.isArray(validatedResult.improvedProjects)
        ? validatedResult.improvedProjects
        : [],
      improvedExperience: Array.isArray(validatedResult.improvedExperience)
        ? validatedResult.improvedExperience
        : [],
      improvedSkillsPresentation: {
        categorizedSkills: Array.isArray(
          validatedResult.improvedSkillsPresentation?.categorizedSkills
        )
          ? validatedResult.improvedSkillsPresentation.categorizedSkills
          : [],
        presentationTips:
          validatedResult.improvedSkillsPresentation?.presentationTips || ''
      },
      suggestionsForMissingInfo: Array.isArray(validatedResult.suggestionsForMissingInfo)
        ? validatedResult.suggestionsForMissingInfo
        : [],
      verificationWarning:
        validatedResult.verificationWarning ||
        'Please review and verify all generated wording before adding it to your resume. The AI improves phrasing but cannot verify factual accuracy. Never claim skills or achievements you have not performed.',
      modelUsed: modelName,
      generatedAt: new Date()
    };
  } catch (err) {
    if (err.code === 'CONFIG_MISSING' || err.statusCode === 503) {
      throw err;
    }

    // Handle Gemini rate limits or quota errors
    if (err.status === 429 || err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
      const rateLimitError = new Error(
        'Gemini AI quota or rate limit exceeded. Please wait a moment and try again.'
      );
      rateLimitError.statusCode = 429;
      throw rateLimitError;
    }

    // Handle authentication / invalid key errors from Google
    if (err.status === 401 || err.status === 403 || err.message?.includes('API_KEY_INVALID')) {
      const authError = new Error(
        'Invalid Google Gemini API key. Please check the GEMINI_API_KEY value in backend/.env.'
      );
      authError.statusCode = 401;
      throw authError;
    }

    // General API timeout or fetch failure
    const generalError = new Error(
      `Gemini AI generation failed: ${err.message || 'Unknown network error'}`
    );
    generalError.statusCode = 502;
    throw generalError;
  }
}

module.exports = {
  generateResumeRewrite,
  parseAndValidateJsonResponse
};
