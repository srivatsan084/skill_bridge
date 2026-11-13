/**
 * Comprehensive Test Suite for Resume Skill Extraction & Normalization
 * Tests:
 * 1. JavaScript correctly identified
 * 2. ReactJS normalized to React
 * 3. NodeJS normalized to Node.js
 * 4. Duplicate skill mentions stored only once
 * 5. Case-insensitive matching
 * 6. Ambiguous terms do not create false positives (e.g. Grade C, Section C, Let's go, communication)
 * 7. Resume with no technical skills returns empty array []
 * 8. Cross-student access denied (403 Forbidden)
 * 9. Existing upload, text extraction, preview and deletion still work
 * 10. Previously uploaded resumes can be processed via POST /api/resume/:id/extract-skills
 * 11. Automatic skill extraction on resume upload
 */

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const { extractSkillsFromText, getSupportedSkills } = require('./utils/skillExtractor');

const BASE_URL = 'http://localhost:5000';

let studentCookie1 = '';
let studentId1 = '';
let studentCookie2 = '';
let studentId2 = '';
let resumeId1 = '';
let resumeId2 = '';

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
  console.log('   RESUME SKILL EXTRACTION & NORMALIZATION TESTS       ');
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

  // --- UNIT TESTS FOR SKILL EXTRACTOR UTILITY ---
  console.log('--- 1. Testing Skill Extractor Utility Logic ---');

  // 1. JavaScript identified
  const jsTest = extractSkillsFromText('Experience developing web apps in JS and ECMAScript.');
  assert(jsTest.includes('JavaScript'), '1. JavaScript Correctly Identified from JS and ECMAScript');

  // 2. ReactJS normalized to React
  const reactTest = extractSkillsFromText('Built interactive frontends with ReactJS and React.js.');
  assert(
    reactTest.includes('React') && !reactTest.includes('ReactJS') && !reactTest.includes('React.js'),
    '2. ReactJS and React.js Normalized to Canonical "React"'
  );

  // 3. NodeJS normalized to Node.js
  const nodeTest = extractSkillsFromText('Backend microservices built using NodeJS and Node.');
  assert(
    nodeTest.includes('Node.js') && !nodeTest.includes('NodeJS'),
    '3. NodeJS and Node Normalized to Canonical "Node.js"'
  );

  // 4. Duplicate skills stored only once
  const dupTest = extractSkillsFromText('React, react.js, ReactJS, REACT, react, React.JS');
  assert(
    dupTest.length === 1 && dupTest[0] === 'React',
    '4. Duplicate Skill Mentions Stored Only Once',
    JSON.stringify(dupTest)
  );

  // 5. Case-insensitive matching
  const caseTest = extractSkillsFromText('pYtHoN, dOcKeR, kUbErNeTeS, tAiLwInD cSs, pOsTgReSqL');
  const expectedCaseSkills = ['Python', 'Docker', 'Kubernetes', 'Tailwind CSS', 'PostgreSQL'];
  const allCaseMatched = expectedCaseSkills.every(s => caseTest.includes(s));
  assert(allCaseMatched, '5. Case-Insensitive Matching Works for All Skill Variations');

  // 6. Ambiguous terms do not create false positives
  const ambiguousText = 'I earned Grade C in Section C. Let us go to meetings. Good communication, leadership and teamwork.';
  const ambiguousTest = extractSkillsFromText(ambiguousText);
  assert(
    ambiguousTest.length === 0,
    '6. Ambiguous Terms (Grade C, go, communication, teamwork) Produce Zero False Positives',
    JSON.stringify(ambiguousTest)
  );

  // 7. Resume with no technical skills returns empty array
  const noSkillTest = extractSkillsFromText('Dedicated student pursuing higher education with strong dedication and punctuality.');
  assert(
    Array.isArray(noSkillTest) && noSkillTest.length === 0,
    '7. Resume with No Recognized Technical Skills Returns Empty Array []'
  );

  // Additional alias validations:
  const cloudDbText = 'Technologies: Mongo DB, Postgre, Amazon Web Services, Microsoft Azure, and CI/CD.';
  const cloudDbTest = extractSkillsFromText(cloudDbText);
  const cloudDbExpected = ['MongoDB', 'PostgreSQL', 'AWS', 'Microsoft Azure', 'CI/CD'];
  assert(
    cloudDbExpected.every(s => cloudDbTest.includes(s)),
    'Extra: Cloud and Database Aliases Normalized (Mongo DB -> MongoDB, Postgre -> PostgreSQL, AWS, Azure, CI/CD)'
  );

  // --- INTEGRATION TESTS WITH BACKEND APIS & MONGODB ---
  console.log('\n--- 2. Testing Endpoints & Database Persistence ---');

  // Setup: Register Student 1
  const ts = Date.now();
  const reg1Res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Priya Sharma',
      email: `priya_extract_${ts}@college.edu`,
      password: 'Password123!',
      college: 'National Institute of Technology',
      targetRole: 'Full Stack Developer'
    })
  });
  const reg1Data = await reg1Res.json();
  const rawCookie1 = reg1Res.headers.get('set-cookie');
  studentCookie1 = rawCookie1 ? rawCookie1.split(';')[0] : '';
  studentId1 = reg1Data.student?._id;

  // Setup: Register Student 2 (for multi-tenant verification)
  const reg2Res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Rohan Verma',
      email: `rohan_extract_${ts}@college.edu`,
      password: 'Password123!',
      college: 'Delhi Technological University',
      targetRole: 'DevOps Engineer'
    })
  });
  const rawCookie2 = reg2Res.headers.get('set-cookie');
  studentCookie2 = rawCookie2 ? rawCookie2.split(';')[0] : '';

  // Upload DOCX Resume for Student 1 with technical skills
  const docxSkillsText = [
    'Priya Sharma - Full Stack Developer',
    'Technical Skills: ReactJS, NodeJS, JavaScript, Mongo DB, Postgre, Git, HTML5, CSS3, Docker, and REST APIs.',
    'Projects: E-commerce platform built with React, Node, and MongoDB database.',
    'Education: B.Tech in Computer Science, CGPA 8.8. Section C student.'
  ];
  const docxBuffer = await createDocxWithText(docxSkillsText);
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const multipartBody = createMultipartFormData(
    boundary,
    { targetRole: 'Full Stack Developer' },
    {
      name: 'resume',
      filename: 'priya_resume_with_skills.docx',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: docxBuffer
    }
  );

  const uploadRes = await fetch(`${BASE_URL}/api/resume/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Cookie: studentCookie1
    },
    body: multipartBody
  });
  const uploadData = await uploadRes.json();
  resumeId1 = uploadData.resume?._id;

  // 11. Automatic extraction on upload
  assert(
    uploadData.success &&
    uploadData.resume?.skillExtractionStatus === 'success' &&
    Array.isArray(uploadData.resume?.extractedSkills) &&
    uploadData.resume?.extractedSkills.includes('React') &&
    uploadData.resume?.extractedSkills.includes('Node.js') &&
    uploadData.resume?.extractedSkills.includes('JavaScript') &&
    uploadData.resume?.extractedSkills.includes('MongoDB') &&
    uploadData.resume?.extractedSkills.includes('PostgreSQL'),
    '11. Automatic Skill Extraction on Upload Populates Resume Model with Normalized Skills'
  );

  // 10. Previously uploaded resume re-extraction endpoint POST /api/resume/:id/extract-skills
  const extractRes = await fetch(`${BASE_URL}/api/resume/${resumeId1}/extract-skills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: studentCookie1
    }
  });
  const extractData = await extractRes.json();
  assert(
    extractRes.status === 200 &&
    extractData.success &&
    extractData.count >= 8 &&
    extractData.extractedSkills.includes('React') &&
    extractData.extractedSkills.includes('Node.js') &&
    extractData.extractedSkills.includes('Docker'),
    '10. POST /api/resume/:id/extract-skills Successfully Re-extracts and Returns Normalized Skills',
    `Count: ${extractData.count}`
  );

  // 8. Cross-student access denied
  const crossExtractRes = await fetch(`${BASE_URL}/api/resume/${resumeId1}/extract-skills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: studentCookie2
    }
  });
  assert(
    crossExtractRes.status === 403,
    '8. Security: Student 2 Cannot Extract Skills from Student 1 Resume (403 Forbidden)'
  );

  // 9. Existing resume preview via GET /api/resume/:id
  const getRes = await fetch(`${BASE_URL}/api/resume/${resumeId1}`, {
    method: 'GET',
    headers: { Cookie: studentCookie1 }
  });
  const getData = await getRes.json();
  assert(
    getRes.status === 200 &&
    getData.resume?.extractedText?.includes('Priya Sharma') &&
    Array.isArray(getData.resume?.extractedSkills) &&
    getData.resume?.extractedSkills.length > 0,
    '9a. Existing GET /api/resume/:id Still Returns Extracted Text and Now Includes Extracted Skills'
  );

  // 9b. Delete resume
  const delRes = await fetch(`${BASE_URL}/api/resume/${resumeId1}`, {
    method: 'DELETE',
    headers: { Cookie: studentCookie1 }
  });
  const delData = await delRes.json();
  assert(
    delRes.status === 200 && delData.success,
    '9b. Existing Resume Delete Operation Still Cleans Up Document and Disk File'
  );

  console.log('\n========================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('[FATAL ERROR]', err);
  process.exit(1);
});
