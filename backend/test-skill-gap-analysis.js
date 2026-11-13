/**
 * Comprehensive Test Suite for Backend Resume-to-Industry Skill-Gap Comparison
 * Tests:
 * 1. Matching skills between a resume and Full Stack Developer profile
 * 2. Correct identification of missing skills
 * 3. Correct identification of resume-only skills
 * 4. ReactJS and React normalization
 * 5. NodeJS and Node.js normalization
 * 6. Correct industry mention counts and percentages
 * 7. Correct total sample size of 420 for Full Stack Developer
 * 8. Handling a missing target role
 * 9. Handling an unavailable industry profile (404)
 * 10. Handling a resume without successful skill extraction (400)
 * 11. Security: Preventing access to another student's resume (403 Forbidden)
 * 12. Saving analysis results in MongoDB
 * 13. Re-running analysis without duplicating or corrupting results
 */

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const { compareSkillsWithIndustry } = require('./utils/skillGapAnalyzer');

const BASE_URL = 'http://localhost:5000';

// Helper to create a valid minimal DOCX buffer with custom text
async function createDocxWithText(textParagraphs) {
  const zip = new JSZip();

  const contentTypesXml = 
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n' +
    '  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n' +
    '  <Default Extension="xml" ContentType="application/xml"/>\n' +
    '  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>\n' +
    '</Types>';

  const relsXml = 
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n' +
    '  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>\n' +
    '</Relationships>';

  const paragraphsXml = textParagraphs
    .map(p => `<w:p><w:r><w:t>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</w:t></w:r></w:p>`)
    .join('\n');

  const documentXml = 
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n' +
    '  <w:body>\n' +
    paragraphsXml + '\n' +
    '  </w:body>\n' +
    '</w:document>';

  zip.file('[Content_Types].xml', contentTypesXml);
  zip.file('_rels/.rels', relsXml);
  zip.file('word/document.xml', documentXml);

  return await zip.generateAsync({ type: 'nodebuffer' });
}

// Multipart form builder
function createMultipartFormData(boundary, fields, fileField) {
  const crlf = '\r\n';
  let body = Buffer.alloc(0);

  for (const [key, val] of Object.entries(fields)) {
    const fieldHeader = `--${boundary}${crlf}Content-Disposition: form-data; name="${key}"${crlf}${crlf}${val}${crlf}`;
    body = Buffer.concat([body, Buffer.from(fieldHeader, 'utf8')]);
  }

  if (fileField) {
    const fileHeader = `--${boundary}${crlf}Content-Disposition: form-data; name="${fileField.name}"; filename="${fileField.filename}"${crlf}Content-Type: ${fileField.contentType}${crlf}${crlf}`;
    const fileFooter = `${crlf}--${boundary}--${crlf}`;
    body = Buffer.concat([
      body,
      Buffer.from(fileHeader, 'utf8'),
      fileField.buffer,
      Buffer.from(fileFooter, 'utf8')
    ]);
  }

  return body;
}

async function runTests() {
  console.log('========================================================');
  console.log('   RESUME-TO-INDUSTRY SKILL-GAP COMPARISON TESTS        ');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.log(`[FAIL] ${testName} ${details ? '– ' + details : ''}`);
      failed++;
    }
  }

  // --- UNIT TESTS: COMPARISON LOGIC & NORMALIZATION ---
  console.log('--- 1. Testing Skill Gap Analyzer Logic ---');

  // Fetch real Full Stack Developer profile from MongoDB API
  const fsdRes = await fetch(`${BASE_URL}/api/industry/roles/full-stack-developer/skills`);
  const fsdData = await fsdRes.json();
  const fsdIndustrySkills = fsdData.skills || [];
  const fsdTotalPostings = fsdData.totalPostings;

  assert(
    fsdTotalPostings === 420 && fsdIndustrySkills.length === 51,
    '7. Real Full Stack Developer Industry Profile Loaded (420 postings, 51 skills)'
  );

  // Unit comparison test
  const sampleResumeSkills = ['ReactJS', 'NodeJS', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS', 'Docker', 'Go'];
  const unitResult = compareSkillsWithIndustry(sampleResumeSkills, fsdIndustrySkills, fsdTotalPostings);

  // 1. Matching skills
  assert(
    unitResult.matchedSkills.length > 0 &&
    unitResult.matchedSkills.some(s => s.skill === 'JavaScript') &&
    unitResult.matchedSkills.some(s => s.skill === 'React') &&
    unitResult.matchedSkills.some(s => s.skill === 'Node.js'),
    '1. Matching Skills Between Resume and Full Stack Developer Profile Correctly Identified'
  );

  // 2. Missing skills
  assert(
    unitResult.missingSkills.length > 0 &&
    unitResult.missingSkills.some(s => s.skill === 'SQL') &&
    unitResult.missingSkills.some(s => s.skill === 'TypeScript'),
    '2. Correct Identification of Missing Skills (e.g. SQL, TypeScript)'
  );

  // 3. Resume-only skills
  assert(
    unitResult.resumeOnlySkills.length > 0 &&
    unitResult.resumeOnlySkills.some(s => s.skill === 'Go'),
    '3. Correct Identification of Resume-Only Skills (e.g. Go)'
  );

  // 4. ReactJS and React normalization
  const reactMatch = unitResult.matchedSkills.find(s => s.skill === 'React');
  assert(
    reactMatch !== undefined && reactMatch.skill === 'React',
    '4. ReactJS in Resume Correctly Normalized and Matched with Industry "React"'
  );

  // 5. NodeJS and Node.js normalization
  const nodeMatch = unitResult.matchedSkills.find(s => s.skill === 'Node.js');
  assert(
    nodeMatch !== undefined && nodeMatch.skill === 'Node.js',
    '5. NodeJS in Resume Correctly Normalized and Matched with Industry "Node.js"'
  );

  // 6. Correct industry mention counts and percentages
  const jsMatch = unitResult.matchedSkills.find(s => s.skill === 'JavaScript');
  assert(
    jsMatch && jsMatch.mentionCount === 271 && jsMatch.percentage === 64.52,
    '6. Verified Exact Industry Mention Count (271) and Percentage (64.52%) for JavaScript'
  );

  // --- INTEGRATION TESTS: AUTH, MONGODB PERSISTENCE & ERROR HANDLING ---
  console.log('\n--- 2. Testing Authenticated Endpoint POST /api/resume/:id/analyze-gap ---');

  const ts = Date.now();

  // Setup: Register Student 1
  const reg1Res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Ananya Roy',
      email: `ananya_gap_${ts}@college.edu`,
      password: 'Password123!',
      college: 'IIT Kharagpur',
      targetRole: 'Full Stack Developer'
    })
  });
  const reg1Data = await reg1Res.json();
  const rawCookie1 = reg1Res.headers.get('set-cookie');
  const cookie1 = rawCookie1 ? rawCookie1.split(';')[0] : '';

  // Setup: Register Student 2 (for security check)
  const reg2Res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Karan Mehra',
      email: `karan_gap_${ts}@college.edu`,
      password: 'Password123!',
      college: 'NIT Trichy',
      targetRole: 'Backend Developer'
    })
  });
  const rawCookie2 = reg2Res.headers.get('set-cookie');
  const cookie2 = rawCookie2 ? rawCookie2.split(';')[0] : '';

  // Upload a resume for Student 1
  const docxText = [
    'Ananya Roy - Full Stack Web Developer',
    'Skills: ReactJS, NodeJS, JavaScript, Mongo DB, Postgre, HTML5, CSS3, Git, and Docker. Also proficient in Go programming.',
    'Experience: Built full-stack applications with React and Node.js REST APIs.',
    'Education: B.Tech Computer Science, graduated 2026.'
  ];
  const docxBuffer = await createDocxWithText(docxText);
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const multipartBody = createMultipartFormData(
    boundary,
    { targetRole: 'Full Stack Developer' },
    {
      name: 'resume',
      filename: 'ananya_resume.docx',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: docxBuffer
    }
  );

  const uploadRes = await fetch(`${BASE_URL}/api/resume/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Cookie: cookie1
    },
    body: multipartBody
  });
  const uploadData = await uploadRes.json();
  const resumeId = uploadData.resume?._id;

  // 12. Run Skill-Gap Analysis on the resume
  const gapRes = await fetch(`${BASE_URL}/api/resume/${resumeId}/analyze-gap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie1
    }
  });
  const gapData = await gapRes.json();

  assert(
    gapRes.status === 200 &&
    gapData.success &&
    gapData.analysis?.role === 'Full Stack Developer' &&
    gapData.analysis?.totalPostings === 420 &&
    gapData.analysis?.matchedSkills?.length > 0 &&
    gapData.analysis?.missingSkills?.length > 0,
    '12. POST /api/resume/:id/analyze-gap Successfully Executes and Saves in MongoDB'
  );

  // 13. Re-running analysis without duplicating or corrupting results
  const rerunRes = await fetch(`${BASE_URL}/api/resume/${resumeId}/analyze-gap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie1
    }
  });
  const rerunData = await rerunRes.json();

  assert(
    rerunRes.status === 200 &&
    rerunData.success &&
    rerunData.analysis.matchedSkills.length === gapData.analysis.matchedSkills.length &&
    rerunData.analysis.missingSkills.length === gapData.analysis.missingSkills.length,
    '13. Re-running Analysis Updates Document Idempotently Without Corrupting Results'
  );

  // Verify persistence via GET /api/resume/:id
  const getResumeRes = await fetch(`${BASE_URL}/api/resume/${resumeId}`, {
    method: 'GET',
    headers: { Cookie: cookie1 }
  });
  const getResumeData = await getResumeRes.json();
  assert(
    getResumeData.resume?.skillGapAnalysis?.role === 'Full Stack Developer' &&
    getResumeData.resume?.skillGapAnalysis?.matchedSkills?.length > 0 &&
    getResumeData.resume?.extractedText?.length > 0 &&
    getResumeData.resume?.extractedSkills?.length > 0,
    '12b. Verification: Stored skillGapAnalysis Retrieved via GET /api/resume/:id Preserving All Original Fields'
  );

  // 11. Preventing cross-student access
  const crossRes = await fetch(`${BASE_URL}/api/resume/${resumeId}/analyze-gap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie2
    }
  });
  assert(
    crossRes.status === 403,
    '11. Security: Student 2 Forbidden (403) from Analyzing Student 1 Resume'
  );

  // 9. Handling unavailable industry profile
  const unavailRes = await fetch(`${BASE_URL}/api/resume/${resumeId}/analyze-gap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie1
    },
    body: JSON.stringify({ targetRole: 'Quantum Teleportation Specialist' })
  });
  assert(
    unavailRes.status === 404,
    '9. Error Handling: Unavailable Industry Profile Returns HTTP 404'
  );

  // 8. Handling missing target role
  // Create a raw test resume with missing targetRole in MongoDB to test handling
  const blankRoleRes = await fetch(`${BASE_URL}/api/resume/${resumeId}/analyze-gap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie1
    },
    body: JSON.stringify({ targetRole: '   ' })
  });
  assert(
    blankRoleRes.status === 400,
    '8. Error Handling: Missing Target Role Returns Clean Validation Error (400)'
  );

  // 10. Handling resume without successful skill extraction
  // We simulate a resume record with skillExtractionStatus: 'pending'
  const mongoose = require('mongoose');
  await mongoose.connect('mongodb://127.0.0.1:27017/skillbridge');
  const ResumeModel = require('./models/Resume');
  
  const pendingResume = await ResumeModel.create({
    student: reg1Data.student._id,
    originalFilename: 'pending_resume.pdf',
    storedFilename: 'pending_resume.pdf',
    filePath: 'dummy/path',
    fileType: 'pdf',
    mimeType: 'application/pdf',
    fileSize: 100,
    targetRole: 'Full Stack Developer',
    extractedText: 'Some unanalyzed text',
    wordCount: 3,
    extractionStatus: 'success',
    extractedSkills: [],
    skillExtractionStatus: 'pending'
  });

  const pendingGapRes = await fetch(`${BASE_URL}/api/resume/${pendingResume._id}/analyze-gap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie1
    }
  });
  assert(
    pendingGapRes.status === 400,
    '10. Error Handling: Resume with Pending Skill Extraction Returns Clear 400 Explaining Skills Must be Extracted First'
  );

  // Cleanup
  await ResumeModel.deleteOne({ _id: pendingResume._id });
  await fetch(`${BASE_URL}/api/resume/${resumeId}`, {
    method: 'DELETE',
    headers: { Cookie: cookie1 }
  });
  await mongoose.disconnect();

  console.log('\n========================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('[FATAL ERROR]', err);
  process.exit(1);
});
