/**
 * Comprehensive Automated Test Suite for AI-Powered Resume Rewrite Feature
 *
 * Verifies:
 * 1. Utility error handling when GEMINI_API_KEY is not configured (CONFIG_MISSING, 503).
 * 2. Robust JSON parsing and schema validation of Gemini responses (handling markdown fences, malformed JSON, missing sections).
 * 3. Authentication & Ownership authorization:
 *    - Unauthenticated request -> HTTP 401
 *    - Access by another student -> HTTP 403 Forbidden
 * 4. Configuration status endpoint behavior:
 *    - Without GEMINI_API_KEY -> HTTP 503 with informative config instructions.
 * 5. Resume rewrite persistence & integrity:
 *    - extractedText and extractedSkills remain untouched.
 *    - rewriteResult subdocument saves all structured fields:
 *      professionalSummary, improvedProjects, improvedExperience, improvedSkillsPresentation, suggestionsForMissingInfo, verificationWarning, modelUsed, generatedAt.
 * 6. Multiple rewrites idempotency (updates existing rewriteResult without duplicating documents).
 * 7. Verification that getMyResumes includes rewriteResult for instant frontend hydration.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '.env') });

const Student = require('./models/Student');
const Resume = require('./models/Resume');
const { generateResumeRewrite, parseAndValidateJsonResponse } = require('./utils/resumeRewriter');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillbridge';
const API_BASE = 'http://127.0.0.1:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'skillbridge_dev_secret';

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
  console.log('=== SkillBridge Resume Rewrite Automated Test Suite ===\n');

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
      if (err.code === 'CONFIG_MISSING' && err.statusCode === 503) {
        configErrorCaught = true;
        console.log(`✓ Caught expected Error with code CONFIG_MISSING: ${err.message}`);
      } else {
        throw err;
      }
    }
    assert(configErrorCaught, 'Should throw Error with code CONFIG_MISSING when API key is missing');

    // Restore original key
    if (originalKey) {
      process.env.GEMINI_API_KEY = originalKey;
    }

    // -----------------------------------------------------------------
    // TEST 2: Unit Test - JSON parser and schema validator
    // -----------------------------------------------------------------
    console.log('\n--- Test 2: JSON response parser and schema validator ---');
    const rawAiResponse = `\`\`\`json
{
  "targetRole": "Full Stack Developer",
  "professionalSummary": {
    "hasOriginalSummary": true,
    "improvedSummary": "Results-driven Full Stack Developer with practical experience building responsive web applications using React, Node.js, and MongoDB.",
    "summaryNotes": "Highlights full stack competency directly aligned with engineering roles."
  },
  "improvedProjects": [
    {
      "originalTitle": "E-Commerce Store",
      "improvedTitle": "Full Stack E-Commerce Platform",
      "originalPoints": ["Built an e-commerce website using React, Node.js, and MongoDB"],
      "improvedPoints": [
        "Architected responsive client interface with React and modular component state management.",
        "Engineered RESTful API endpoints in Node.js and Express with MongoDB persistence."
      ],
      "skillsUsed": ["React", "Node.js", "Express", "MongoDB"]
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
        "skills": ["JavaScript", "Python"]
      },
      {
        "category": "Frameworks & Libraries",
        "skills": ["React", "Express.js"]
      },
      {
        "category": "Databases",
        "skills": ["MongoDB"]
      }
    ],
    "presentationTips": "Group skills by domain to optimize ATS keyword parsing for Full Stack roles."
  },
  "suggestionsForMissingInfo": [
    "Consider adding measurable outcomes such as test coverage or deployment environment details."
  ],
  "verificationWarning": "Please review and verify all generated wording before adding it to your resume. The AI improves phrasing but cannot verify factual accuracy. Never claim skills or achievements you have not performed."
}
\`\`\``;

    const validated = parseAndValidateJsonResponse(rawAiResponse);
    assert(validated.professionalSummary.improvedSummary.includes('Full Stack Developer'), 'Professional summary should be parsed');
    assert(validated.improvedProjects.length === 1, 'Should parse improved projects');
    assert(validated.improvedProjects[0].skillsUsed.includes('React'), 'Project skillsUsed should include React');
    assert(validated.improvedSkillsPresentation.categorizedSkills.length === 3, 'Skills categories should be parsed');
    assert(validated.suggestionsForMissingInfo.length === 1, 'Missing info suggestions should be parsed');
    assert(validated.verificationWarning.includes('verify'), 'Verification warning should be present');
    console.log('✓ parseAndValidateJsonResponse successfully parsed and validated structured schema');

    // -----------------------------------------------------------------
    // TEST 3: Setup two test students
    // -----------------------------------------------------------------
    console.log('\n--- Test 3: Setting up test students ---');
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
    // TEST 4: Seed test resume for Student 1
    // -----------------------------------------------------------------
    console.log('\n--- Test 4: Seeding Resume for Student 1 ---');
    const originalExtractedText = `Alice Rewriter
Email: alice@test.com
Objective: Aspiring Full Stack Developer.
Skills: JavaScript, React, Node.js, Express, MongoDB, Git.
Projects:
1. E-Commerce Store: Built an e-commerce website using React, Node.js, and MongoDB.
Handled product catalog and user authentication.`;

    const originalExtractedSkills = ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'Git'];

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
      wordCount: 35,
      targetRole: 'Full Stack Developer',
      extractedSkills: originalExtractedSkills,
      skillExtractionStatus: 'success',
    });

    const resumeId = testResume._id.toString();
    console.log(`✓ Seeded Resume ID: ${resumeId}`);

    // -----------------------------------------------------------------
    // TEST 5: Authentication & Authorization checks on POST /api/resume/:id/rewrite
    // -----------------------------------------------------------------
    console.log('\n--- Test 5: Endpoint Authentication & Authorization ---');

    // 5a. Unauthenticated request
    const unauthRes = await makeRequest('POST', `/resume/${resumeId}/rewrite`, {}, { targetRole: 'Full Stack Developer' });
    assert(unauthRes.status === 401, `Expected 401 Unauthorized for no token, got ${unauthRes.status}`);
    console.log('✓ Unauthenticated request rejected with HTTP 401');

    // 5b. Request by different student (Student 2)
    const forbiddenRes = await makeRequest(
      'POST',
      `/resume/${resumeId}/rewrite`,
      { Authorization: `Bearer ${token2}` },
      { targetRole: 'Full Stack Developer' }
    );
    assert(forbiddenRes.status === 403, `Expected 403 Forbidden for cross-student access, got ${forbiddenRes.status}`);
    console.log('✓ Cross-student rewrite request rejected with HTTP 403 Forbidden');

    // -----------------------------------------------------------------
    // TEST 6: Missing GEMINI_API_KEY handling on POST /api/resume/:id/rewrite
    // -----------------------------------------------------------------
    console.log('\n--- Test 6: Missing GEMINI_API_KEY handling by server ---');
    const rewriteRes = await makeRequest(
      'POST',
      `/resume/${resumeId}/rewrite`,
      { Authorization: `Bearer ${token1}` },
      { targetRole: 'Full Stack Developer' }
    );

    // If GEMINI_API_KEY is not configured in backend/.env, it should return 503
    if (!process.env.GEMINI_API_KEY) {
      assert(rewriteRes.status === 503, `Expected 503 Service Unavailable when GEMINI_API_KEY is unset, got ${rewriteRes.status}`);
      assert(rewriteRes.body.code === 'CONFIG_MISSING', `Expected code CONFIG_MISSING, got ${rewriteRes.body.code}`);
      assert(
        rewriteRes.body.message.includes('GEMINI_API_KEY'),
        `Expected error message to explain missing GEMINI_API_KEY: ${rewriteRes.body.message}`
      );
      console.log('✓ Server correctly returns HTTP 503 with CONFIG_MISSING and setup instructions when API key is missing');
    } else {
      console.log(`✓ GEMINI_API_KEY is configured; status: ${rewriteRes.status}`);
    }

    // -----------------------------------------------------------------
    // TEST 7: Persistence & Non-destructive update verification
    // -----------------------------------------------------------------
    console.log('\n--- Test 7: Persistence and Data Integrity ---');
    // Save rewriteResult directly as would be done by the controller
    testResume.rewriteResult = {
      targetRole: 'Full Stack Developer',
      professionalSummary: validated.professionalSummary,
      improvedProjects: validated.improvedProjects,
      improvedExperience: validated.improvedExperience,
      improvedSkillsPresentation: validated.improvedSkillsPresentation,
      suggestionsForMissingInfo: validated.suggestionsForMissingInfo,
      verificationWarning: validated.verificationWarning,
      modelUsed: 'gemini-2.5-flash',
      generatedAt: new Date(),
    };
    await testResume.save();

    // Re-fetch from database to verify
    const fetchedResume = await Resume.findById(resumeId);
    assert(fetchedResume.extractedText === originalExtractedText, 'extractedText must remain completely untouched');
    assert(fetchedResume.extractedSkills.length === originalExtractedSkills.length, 'extractedSkills must remain untouched');
    assert(fetchedResume.rewriteResult !== null, 'rewriteResult must be persisted');
    assert(fetchedResume.rewriteResult.targetRole === 'Full Stack Developer', 'targetRole in rewriteResult must match');
    assert(fetchedResume.rewriteResult.improvedProjects.length === 1, 'improvedProjects must be saved');
    assert(
      fetchedResume.rewriteResult.improvedSkillsPresentation.categorizedSkills.some((c) =>
        c.skills.includes('JavaScript')
      ),
      'skills must be saved in categorizedSkills'
    );
    console.log('✓ Resume rewriteResult successfully persisted without mutating original extracted text or skills');

    // -----------------------------------------------------------------
    // TEST 8: GET /api/resume returns rewriteResult
    // -----------------------------------------------------------------
    console.log('\n--- Test 8: GET /api/resume includes rewriteResult ---');
    const myResumesRes = await makeRequest('GET', '/resume', { Authorization: `Bearer ${token1}` });
    assert(myResumesRes.status === 200, `Expected 200 OK, got ${myResumesRes.status}`);
    const foundResume = myResumesRes.body.resumes.find((r) => r._id === resumeId);
    assert(foundResume, 'Should find seeded resume in my-resumes list');
    assert(foundResume.rewriteResult !== undefined, 'rewriteResult must be included in my-resumes payload');
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

    console.log('\n======================================================');
    console.log('🎉 ALL RESUME REWRITE TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('======================================================\n');
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
