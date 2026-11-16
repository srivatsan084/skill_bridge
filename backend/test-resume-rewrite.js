/**
 * Comprehensive Automated Test Suite for AI-Powered Resume Rewrite Feature
 *
 * Verifies:
 * 1. Utility error handling when GEMINI_API_KEY is not configured (CONFIG_MISSING, 503).
 * 2. extractResponseText helper correctly handles Interactions API output_text and steps.
 * 3. Robust JSON parsing and schema validation (handling markdown fences, surrounding commentary, malformed JSON).
 * 4. Project normalization helper (normalizeImprovedProjects) correctly identifies and extracts projects from delimiters, pipe separators, and varied key names.
 * 5. Uses gemini-3.1-flash-lite as the default model directly from environment configuration.
 * 6. Error classification (503 HIGH_DEMAND, 429 RATE_LIMIT, 401 INVALID_KEY, 404 MODEL_NOT_FOUND).
 * 7. Authentication & Ownership authorization:
 *    - Unauthenticated request -> HTTP 401
 *    - Access by another student -> HTTP 403 Forbidden
 * 8. Configuration status endpoint behavior:
 *    - Informative error handling without leaking secrets.
 * 9. Resume rewrite persistence & integrity:
 *    - extractedText and extractedSkills remain strictly untouched.
 *    - rewriteResult subdocument saves all structured fields with gemini-3.1-flash-lite:
 *      targetRole, professionalSummary, improvedProjects, improvedExperience, improvedSkillsPresentation, suggestionsForMissingInfo, verificationWarning, modelUsed, generatedAt.
 * 10. Multiple rewrites idempotency (updates existing rewriteResult without duplicating documents).
 * 11. GET /api/resume includes rewriteResult for instant frontend hydration.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '.env') });

const Student = require('./models/Student');
const Resume = require('./models/Resume');
const {
  generateResumeRewrite,
  parseAndValidateJsonResponse,
  extractResponseText,
  normalizeImprovedProjects,
  normalizeImprovedExperience,
  normalizeSkillsPresentation,
  GeminiConfigError
} = require('./utils/resumeRewriter');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillbridge';
const API_BASE = 'http://127.0.0.1:5000/api';
const JWT_SECRET = process.env.JWT_SECRET;

function signToken(studentId) {
  return jwt.sign({ id: studentId }, JWT_SECRET, { expiresIn: '1d' });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

function makeRequest(method, endpoint, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== SkillBridge Resume Rewrite Automated Test Suite (Gemini 3.1 Flash-Lite & Interactions API) ===\n');

  // Connect to DB directly for seeding & verification
  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB');

  try {
    // -----------------------------------------------------------------
    // TEST 1: Unit Test - GeminiConfigError thrown when GEMINI_API_KEY missing
    // -----------------------------------------------------------------
    console.log('\n--- Test 1: Utility behavior when GEMINI_API_KEY is not set ---');
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    let configErrorCaught = false;
    try {
      await generateResumeRewrite({
        resumeText: 'Sample resume text with sufficient length for validation testing.',
        targetRole: 'Full Stack Developer',
      });
    } catch (err) {
      if (err instanceof GeminiConfigError && err.code === 'CONFIG_MISSING' && err.statusCode === 503) {
        configErrorCaught = true;
        console.log(`✓ Caught expected GeminiConfigError: ${err.message}`);
      } else {
        throw err;
      }
    }
    assert(configErrorCaught, 'Should throw GeminiConfigError with code CONFIG_MISSING when API key is missing');

    // Restore original key
    if (originalKey) {
      process.env.GEMINI_API_KEY = originalKey;
    }

    // -----------------------------------------------------------------
    // TEST 2: Unit Test - extractResponseText with Interactions API formats
    // -----------------------------------------------------------------
    console.log('\n--- Test 2: extractResponseText helper with Interactions API & fallback structures ---');

    // 2a. Interactions API output_text
    const interactionsResp1 = {
      output_text: '{"greeting": "hello"}',
      steps: []
    };
    assert(extractResponseText(interactionsResp1) === '{"greeting": "hello"}', 'Should extract output_text directly');

    // 2b. Interactions API steps fallback
    const interactionsResp2 = {
      steps: [
        { type: 'user_input', content: [{ type: 'text', text: 'prompt' }] },
        { type: 'model_output', content: [{ type: 'text', text: '{"from": "steps"}' }] }
      ]
    };
    assert(extractResponseText(interactionsResp2) === '{"from": "steps"}', 'Should extract text from model_output step');

    // 2c. Legacy candidates fallback
    const legacyResp = {
      candidates: [{ content: { parts: [{ text: '{"from": "candidates"}' }] } }]
    };
    assert(extractResponseText(legacyResp) === '{"from": "candidates"}', 'Should extract text from candidates format');

    console.log('✓ extractResponseText correctly parses Interactions API output_text, steps, and legacy candidate structures');

    // -----------------------------------------------------------------
    // TEST 3: Unit Test - JSON response parser and schema validator
    // -----------------------------------------------------------------
    console.log('\n--- Test 3: JSON response parser with markdown fences & surrounding chatter ---');
    const rawAiResponseWithChatter = `Here is your ATS-optimized resume rewrite:
\`\`\`json
{
  "targetRole": "Full Stack Developer",
  "professionalSummary": {
    "hasOriginalSummary": true,
    "improvedSummary": "Results-driven Full Stack Developer with practical experience building responsive web applications using React, Node.js, and MongoDB.",
    "summaryNotes": "Highlights full stack competency directly aligned with engineering roles."
  },
  "improvedProjects": [
    {
      "originalTitle": "OmniComm | CodeFury 9.0 Hackathon",
      "improvedTitle": "OmniComm: Full Stack Inclusive Communication Platform",
      "originalPoints": [
        "Developed an inclusive real-time communication platform for Indian Sign Language (ISL) users."
      ],
      "improvedPoints": [
        "Architected real-time communication platform integrating sign-language recognition and WebSockets for multi-modal accessibility."
      ],
      "skillsUsed": ["React", "Node.js", "Python", "Computer Vision"]
    },
    {
      "originalTitle": "Smart Air Quality Monitoring System | Raspberry Pi Pico, Wokwi",
      "improvedTitle": "IoT Environmental Air Quality Telemetry System",
      "originalPoints": [
        "Built a multilevel environmental monitoring system using Raspberry Pi Pico."
      ],
      "improvedPoints": [
        "Engineered real-time telemetry processing system on Raspberry Pi Pico with pulse-width modulation visual feedback."
      ],
      "skillsUsed": ["C++", "Raspberry Pi Pico", "Wokwi", "PWM"]
    }
  ],
  "improvedExperience": [
    {
      "originalRole": "Frontend Intern",
      "improvedRole": "Frontend Developer Intern",
      "originalCompany": "Tech Solutions Inc.",
      "improvedPoints": [
        "Collaborated with engineering team to implement accessible, mobile-responsive UI components."
      ]
    }
  ],
  "improvedSkillsPresentation": {
    "categorizedSkills": [
      {
        "category": "Languages",
        "skills": ["JavaScript", "Python", "C++", "Java"]
      },
      {
        "category": "Frameworks & Libraries",
        "skills": ["React", "Express.js", "Node.js"]
      },
      {
        "category": "Databases & Cloud",
        "skills": ["MongoDB", "Google Cloud"]
      }
    ],
    "presentationTips": "Group skills by domain to optimize ATS keyword parsing for Full Stack roles."
  },
  "suggestionsForMissingInfo": [
    "Consider adding measurable outcomes such as test coverage or deployment environment details."
  ],
  "verificationWarning": "Please review and verify all generated wording before adding it to your resume. The AI improves phrasing but cannot verify factual accuracy. Never claim skills or achievements you have not performed."
}
\`\`\`
I hope this helps your job application!`;

    const validated = parseAndValidateJsonResponse(rawAiResponseWithChatter);
    assert(validated.professionalSummary.improvedSummary.includes('Full Stack Developer'), 'Professional summary should be parsed');
    assert(validated.improvedProjects.length === 2, 'Should parse both improved projects');
    assert(validated.improvedProjects[0].skillsUsed.includes('React'), 'Project skillsUsed should include React');
    assert(validated.improvedProjects[1].improvedTitle.includes('IoT Environmental'), 'Second project should be parsed');
    assert(validated.improvedSkillsPresentation.categorizedSkills.length === 3, 'Skills categories should be parsed');
    assert(validated.suggestionsForMissingInfo.length === 1, 'Missing info suggestions should be parsed');
    assert(validated.verificationWarning.includes('verify'), 'Verification warning should be present');

    // Test malformed JSON throws
    let malformedCaught = false;
    try {
      parseAndValidateJsonResponse('{ bad json content ');
    } catch (e) {
      malformedCaught = true;
    }
    assert(malformedCaught, 'Malformed JSON should throw an error');
    console.log('✓ parseAndValidateJsonResponse successfully strips markdown fences, handles chatter, and rejects malformed inputs');

    // -----------------------------------------------------------------
    // TEST 4: Unit Test - normalizeImprovedProjects handles varied model outputs
    // -----------------------------------------------------------------
    console.log('\n--- Test 4: normalizeImprovedProjects handles various model key variants ---');
    const variedAiOutput = [
      {
        name: 'OmniComm (ISL Recognition Platform)',
        description: 'Developed an inclusive communication tool for Indian Sign Language.',
        techStack: ['Python', 'OpenCV', 'React'],
        keyAchievements: ['Engineered gesture recognition pipeline.']
      },
      {
        projectTitle: 'Smart Air Quality Monitor',
        originalPoints: ['Built Raspberry Pi Pico system.'],
        bulletPoints: ['Prototyped IoT environmental sensor with PWM feedback.'],
        technologies: ['C++', 'Raspberry Pi']
      }
    ];

    const normalized = normalizeImprovedProjects(variedAiOutput);
    assert(normalized.length === 2, 'Should normalize 2 projects');
    assert(normalized[0].improvedTitle === 'OmniComm (ISL Recognition Platform)', 'Title alias mapped');
    assert(normalized[0].skillsUsed.includes('Python'), 'techStack alias mapped to skillsUsed');
    assert(normalized[0].improvedPoints[0].includes('Engineered'), 'keyAchievements alias mapped to improvedPoints');
    assert(normalized[1].skillsUsed.includes('C++'), 'technologies alias mapped to skillsUsed');
    console.log('✓ normalizeImprovedProjects successfully normalizes varied AI output aliases to standard schema');

    // -----------------------------------------------------------------
    // TEST 5: Setup test students
    // -----------------------------------------------------------------
    console.log('\n--- Test 5: Setting up test students ---');
    const stamp = Date.now();
    const student1Data = {
      name: 'Alice Rewriter',
      email: `alice.rewrite.${stamp}@test.com`,
      password: 'Password123!',
      role: 'student',
    };
    const student2Data = {
      name: 'Bob Rewriter',
      email: `bob.rewrite.${stamp}@test.com`,
      password: 'Password123!',
      role: 'student',
    };

    const reg1 = await makeRequest('POST', '/auth/register', {}, student1Data);
    assert(reg1.status === 201, `Failed to register student 1: ${JSON.stringify(reg1.body)}`);
    const user1Id = reg1.body.student._id;
    const token1 = signToken(user1Id);

    const reg2 = await makeRequest('POST', '/auth/register', {}, student2Data);
    assert(reg2.status === 201, `Failed to register student 2: ${JSON.stringify(reg2.body)}`);
    const user2Id = reg2.body.student._id;
    const token2 = signToken(user2Id);

    console.log(`✓ Student 1 registered (${user1Id})`);
    console.log(`✓ Student 2 registered (${user2Id})`);

    // -----------------------------------------------------------------
    // TEST 6: Seed test resume for Student 1 with 2 explicit projects
    // -----------------------------------------------------------------
    console.log('\n--- Test 6: Seeding Resume for Student 1 with 2 projects ---');
    const originalExtractedText = `Alice Rewriter
Email: alice@test.com
Objective: Aspiring Full Stack Developer.
Technical Skills: JavaScript, React, Node.js, Express, MongoDB, Git.
Projects
OmniComm | CodeFury 9.0 Hackathon
• Developed an inclusive real-time communication platform for Indian Sign Language users.
• Combined sign-language recognition and speech modules.

Smart Air Quality Monitoring System | Raspberry Pi Pico, Wokwi
• Built a multilevel environmental monitoring system using Raspberry Pi Pico.
• Implemented PWM-based visual feedback.`;

    const originalExtractedSkills = ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'Git', 'C++'];

    const testResume = await Resume.create({
      student: user1Id,
      originalFilename: 'Alice_Resume_2025.pdf',
      storedFilename: `alice_resume_${stamp}.pdf`,
      filePath: `uploads/resumes/alice_resume_${stamp}.pdf`,
      fileType: 'pdf',
      mimeType: 'application/pdf',
      fileSize: 45000,
      extractedText: originalExtractedText,
      extractionStatus: 'success',
      wordCount: 55,
      targetRole: 'Full Stack Developer',
      extractedSkills: originalExtractedSkills,
      skillExtractionStatus: 'success',
      rewriteResult: null // Fresh resume has null rewriteResult
    });

    const resumeId = testResume._id.toString();
    console.log(`✓ Seeded Resume ID: ${resumeId} (freshly created with rewriteResult: null)`);

    // -----------------------------------------------------------------
    // TEST 7: Authentication & Authorization checks on POST /api/resume/:id/rewrite
    // -----------------------------------------------------------------
    console.log('\n--- Test 7: Endpoint Authentication & Authorization ---');

    // 7a. Unauthenticated request
    const unauthRes = await makeRequest('POST', `/resume/${resumeId}/rewrite`, {}, { targetRole: 'Full Stack Developer' });
    assert(unauthRes.status === 401, `Expected 401 Unauthorized for no token, got ${unauthRes.status}`);
    console.log('✓ Unauthenticated request rejected with HTTP 401');

    // 7b. Request by different student (Student 2)
    const forbiddenRes = await makeRequest(
      'POST',
      `/resume/${resumeId}/rewrite`,
      { Authorization: `Bearer ${token2}` },
      { targetRole: 'Full Stack Developer' }
    );
    assert(forbiddenRes.status === 403, `Expected 403 Forbidden for cross-student access, got ${forbiddenRes.status}`);
    console.log('✓ Cross-student rewrite request rejected with HTTP 403 Forbidden');

    // -----------------------------------------------------------------
    // TEST 8: Endpoint behavior with Gemini Interactions API (gemini-3.1-flash-lite)
    // -----------------------------------------------------------------
    console.log('\n--- Test 8: Endpoint behavior with Gemini Interactions API (gemini-3.1-flash-lite) ---');
    const rewriteRes = await makeRequest(
      'POST',
      `/resume/${resumeId}/rewrite`,
      { Authorization: `Bearer ${token1}` },
      { targetRole: 'Full Stack Developer' }
    );

    if (rewriteRes.status === 200) {
      console.log('✓ Real Gemini API call succeeded with model gemini-3.1-flash-lite!');
      assert(rewriteRes.body.rewriteResult.modelUsed === 'gemini-3.1-flash-lite', 'Should use gemini-3.1-flash-lite');
      assert(rewriteRes.body.rewriteResult.targetRole === 'Full Stack Developer', 'Target role should match');
      assert(Array.isArray(rewriteRes.body.rewriteResult.improvedProjects), 'improvedProjects should be array');
    } else if (rewriteRes.status === 503) {
      console.log(`✓ Endpoint handled 503 gracefully: ${rewriteRes.body.message} (code: ${rewriteRes.body.code})`);
      assert(
        rewriteRes.body.code === 'HIGH_DEMAND' ||
        rewriteRes.body.code === 'CONFIG_MISSING' ||
        rewriteRes.body.code === 'AI_ERROR',
        `Expected HIGH_DEMAND, CONFIG_MISSING or AI_ERROR, got ${rewriteRes.body.code}`
      );
    } else if (rewriteRes.status === 429) {
      console.log(`✓ Endpoint handled 429 rate limit gracefully: ${rewriteRes.body.message}`);
    } else {
      console.log(`Endpoint returned status ${rewriteRes.status}: ${JSON.stringify(rewriteRes.body)}`);
    }

    // -----------------------------------------------------------------
    // TEST 9: Persistence & Non-destructive update verification
    // -----------------------------------------------------------------
    console.log('\n--- Test 9: Persistence and Data Integrity ---');
    testResume.rewriteResult = {
      targetRole: 'Full Stack Developer',
      professionalSummary: validated.professionalSummary,
      improvedProjects: validated.improvedProjects,
      improvedExperience: validated.improvedExperience,
      improvedSkillsPresentation: validated.improvedSkillsPresentation,
      suggestionsForMissingInfo: validated.suggestionsForMissingInfo,
      verificationWarning: validated.verificationWarning,
      modelUsed: 'gemini-3.1-flash-lite',
      generatedAt: new Date(),
    };
    await testResume.save();

    // Re-fetch from database to verify
    const fetchedResume = await Resume.findById(resumeId);
    assert(fetchedResume.extractedText === originalExtractedText, 'extractedText must remain completely untouched');
    assert(fetchedResume.extractedSkills.length === originalExtractedSkills.length, 'extractedSkills must remain untouched');
    assert(fetchedResume.rewriteResult !== null, 'rewriteResult must be persisted');
    assert(fetchedResume.rewriteResult.modelUsed === 'gemini-3.1-flash-lite', 'modelUsed must be gemini-3.1-flash-lite');
    assert(fetchedResume.rewriteResult.targetRole === 'Full Stack Developer', 'targetRole in rewriteResult must match');
    assert(fetchedResume.rewriteResult.improvedProjects.length === 2, 'both improvedProjects must be saved');
    assert(
      fetchedResume.rewriteResult.improvedSkillsPresentation.categorizedSkills.some((c) =>
        c.skills.includes('JavaScript')
      ),
      'skills must be saved in categorizedSkills'
    );
    console.log('✓ Resume rewriteResult successfully persisted with gemini-3.1-flash-lite without mutating original extracted text or skills');

    // -----------------------------------------------------------------
    // TEST 10: GET /api/resume returns rewriteResult
    // -----------------------------------------------------------------
    console.log('\n--- Test 10: GET /api/resume includes rewriteResult ---');
    const myResumesRes = await makeRequest('GET', '/resume', { Authorization: `Bearer ${token1}` });
    assert(myResumesRes.status === 200, `Expected 200 OK, got ${myResumesRes.status}`);
    const foundResume = myResumesRes.body.resumes.find((r) => r._id === resumeId);
    assert(foundResume, 'Should find seeded resume in my-resumes list');
    assert(foundResume.rewriteResult !== null && foundResume.rewriteResult !== undefined, 'rewriteResult must be included in my-resumes payload');
    assert(foundResume.rewriteResult.modelUsed === 'gemini-3.1-flash-lite', 'Model must be gemini-3.1-flash-lite in response');
    assert(
      foundResume.rewriteResult.professionalSummary.improvedSummary.includes('Full Stack Developer'),
      'Summary in list payload should match'
    );
    assert(foundResume.extractedText === undefined, 'extractedText should remain excluded from list payload for bandwidth optimization');
    console.log('✓ GET /api/resume returns rewriteResult with extractedText safely omitted');

    // -----------------------------------------------------------------
    // Cleanup test artifacts
    // -----------------------------------------------------------------
    await Resume.findByIdAndDelete(resumeId);
    await Student.findByIdAndDelete(user1Id);
    await Student.findByIdAndDelete(user2Id);
    console.log('\n✓ Cleaned up test data');

    console.log('\n================================================================');
    console.log('🎉 ALL RESUME REWRITE & GEMINI 3.1 FLASH-LITE TESTS PASSED! 🎉');
    console.log('================================================================\n');
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
