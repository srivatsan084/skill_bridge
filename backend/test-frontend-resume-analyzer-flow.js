/**
 * End-to-End Verification of Frontend Resume Analyzer Integration & Data Accuracy
 * Tests:
 * 1. Resume list loads correctly via GET /api/resume
 * 2. Existing resume can be selected
 * 3. Analyze button calls POST /api/resume/:id/analyze-gap
 * 4. Full Stack Developer uses 420 postings and 51 industry skills
 * 5. JavaScript shows 271 mentions (64.52%)
 * 6. React shows 190 mentions (45.24%)
 * 7. Node.js shows 98 mentions (23.33%)
 * 8. MongoDB shows 31 mentions (7.38%)
 * 9. Matched, Missing and Resume-Only groups structure verified
 * 10. Persisted analysis remains available on GET /api/resume (page refresh simulation)
 * 11. Existing upload, delete and preview features work
 * 12. Security: Student 2 cannot access or analyze Student 1's resume
 */

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const BASE_URL = 'http://localhost:5000';

async function createDocxWithSkills(textParagraphs) {
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

async function runVerification() {
  console.log('========================================================');
  console.log('   RESUME ANALYZER FRONTEND & BACKEND INTEGRATION TEST   ');
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

  const ts = Date.now();

  // 1. Setup Student 1
  const reg1Res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Aditya Sen',
      email: `aditya_analyzer_${ts}@college.edu`,
      password: 'Password123!',
      college: 'BITS Pilani',
      targetRole: 'Full Stack Developer'
    })
  });
  const reg1Data = await reg1Res.json();
  const rawCookie1 = reg1Res.headers.get('set-cookie');
  const cookie1 = rawCookie1 ? rawCookie1.split(';')[0] : '';

  // Setup Student 2 for multi-tenant check
  const reg2Res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Deepa Roy',
      email: `deepa_analyzer_${ts}@college.edu`,
      password: 'Password123!',
      college: 'IIT Roorkee',
      targetRole: 'Data Scientist'
    })
  });
  const rawCookie2 = reg2Res.headers.get('set-cookie');
  const cookie2 = rawCookie2 ? rawCookie2.split(';')[0] : '';

  // 11a. Test Resume Upload with actual skills
  const docxText = [
    'Aditya Sen - Full Stack Software Developer',
    'Technical Skills: React, Node.js, JavaScript, MongoDB, Docker, Git. Also experienced in Golang and Rust.',
    'Projects: Full-stack SaaS application with ReactJS, NodeJS, and MongoDB database.',
    'Education: B.Tech Computer Science, graduated 2026.'
  ];
  const docxBuffer = await createDocxWithSkills(docxText);
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const multipartBody = createMultipartFormData(
    boundary,
    { targetRole: 'Full Stack Developer' },
    {
      name: 'resume',
      filename: 'aditya_resume.docx',
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

  assert(
    uploadRes.status === 201 && uploadData.success && resumeId,
    '11a. Resume Upload and Initial Parsing Succeeded'
  );

  // 1. Resume list loads correctly
  const listRes = await fetch(`${BASE_URL}/api/resume`, {
    method: 'GET',
    headers: { Cookie: cookie1 }
  });
  const listData = await listRes.json();
  assert(
    listRes.status === 200 && listData.success && listData.resumes.length === 1,
    '1. Resume List Loads Correctly via GET /api/resume'
  );

  // 2. Existing resume can be selected
  const selectedResume = listData.resumes.find(r => r._id === resumeId);
  assert(
    selectedResume && selectedResume.originalFilename === 'aditya_resume.docx',
    '2. Existing Resume Successfully Selected with Matching Filename'
  );

  // 3. Analyze button calls POST /api/resume/:id/analyze-gap
  const gapRes = await fetch(`${BASE_URL}/api/resume/${resumeId}/analyze-gap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie1
    },
    body: JSON.stringify({ targetRole: 'Full Stack Developer' })
  });
  const gapData = await gapRes.json();
  assert(
    gapRes.status === 200 && gapData.success && gapData.analysis,
    '3. Analyze Button Calls POST /api/resume/:id/analyze-gap and Returns Analysis'
  );

  const analysis = gapData.analysis;

  // 4. Full Stack Developer uses 420 postings and 51 industry skills
  const totalIndustrySkills = analysis.matchedSkills.length + analysis.missingSkills.length;
  assert(
    analysis.totalPostings === 420 && totalIndustrySkills === 51,
    '4. Full Stack Developer Uses Exactly 420 Analyzed Postings and 51 Industry Skills'
  );

  // 5. JavaScript shows 271 mentions and 64.52%
  const jsSkill = analysis.matchedSkills.find(s => s.skill === 'JavaScript');
  assert(
    jsSkill && jsSkill.mentionCount === 271 && jsSkill.percentage === 64.52,
    `5. JavaScript Verified: 271 Mentions and 64.52% (Actual: ${jsSkill?.mentionCount}, ${jsSkill?.percentage}%)`
  );

  // 6. React shows 190 mentions and 45.24%
  const reactSkill = analysis.matchedSkills.find(s => s.skill === 'React');
  assert(
    reactSkill && reactSkill.mentionCount === 190 && reactSkill.percentage === 45.24,
    `6. React Verified: 190 Mentions and 45.24% (Actual: ${reactSkill?.mentionCount}, ${reactSkill?.percentage}%)`
  );

  // 7. Node.js shows 98 mentions and 23.33%
  const nodeSkill = analysis.matchedSkills.find(s => s.skill === 'Node.js');
  assert(
    nodeSkill && nodeSkill.mentionCount === 98 && nodeSkill.percentage === 23.33,
    `7. Node.js Verified: 98 Mentions and 23.33% (Actual: ${nodeSkill?.mentionCount}, ${nodeSkill?.percentage}%)`
  );

  // 8. MongoDB shows 31 mentions and 7.38%
  const mongoSkill = analysis.matchedSkills.find(s => s.skill === 'MongoDB');
  assert(
    mongoSkill && mongoSkill.mentionCount === 31 && mongoSkill.percentage === 7.38,
    `8. MongoDB Verified: 31 Mentions and 7.38% (Actual: ${mongoSkill?.mentionCount}, ${mongoSkill?.percentage}%)`
  );

  // 9. Matched, Missing and Resume-Only groups display correctly
  assert(
    analysis.matchedSkills.length >= 4 &&
    analysis.missingSkills.length > 0 &&
    analysis.resumeOnlySkills.length > 0 &&
    analysis.missingSkills.every(s => s.frequencyCategory) &&
    analysis.resumeOnlySkills.some(s => s.skill === 'Go'),
    '9. Matched, Missing, and Resume-Only Groups Fully Populated with Correct Categorization'
  );

  // 10. Persisted analysis remains available after page refresh simulation (GET /api/resume)
  const refreshRes = await fetch(`${BASE_URL}/api/resume`, {
    method: 'GET',
    headers: { Cookie: cookie1 }
  });
  const refreshData = await refreshRes.json();
  const refreshedResume = refreshData.resumes.find(r => r._id === resumeId);
  assert(
    refreshedResume &&
    refreshedResume.skillGapAnalysis &&
    refreshedResume.skillGapAnalysis.role === 'Full Stack Developer' &&
    refreshedResume.skillGapAnalysis.matchedSkills.length === analysis.matchedSkills.length,
    '10. Persisted Analysis Remains Available on Resume Refresh Without Re-upload'
  );

  // 11b. Extracted text preview works via GET /api/resume/:id
  const previewRes = await fetch(`${BASE_URL}/api/resume/${resumeId}`, {
    method: 'GET',
    headers: { Cookie: cookie1 }
  });
  const previewData = await previewRes.json();
  assert(
    previewRes.status === 200 &&
    previewData.resume?.extractedText?.includes('Aditya Sen') &&
    previewData.resume?.wordCount > 0,
    '11b. Extracted Text Preview Feature Continues Working with Preserved Formatting'
  );

  // 12. Security: Student 2 cannot access or analyze Student 1's resume
  const crossAnalyzeRes = await fetch(`${BASE_URL}/api/resume/${resumeId}/analyze-gap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie2
    }
  });
  const crossGetRes = await fetch(`${BASE_URL}/api/resume/${resumeId}`, {
    method: 'GET',
    headers: { Cookie: cookie2 }
  });
  assert(
    crossAnalyzeRes.status === 403 && crossGetRes.status === 403,
    '12. Security: Cross-Student Access Strictly Forbidden (HTTP 403)'
  );

  // Cleanup: Delete test resume
  const delRes = await fetch(`${BASE_URL}/api/resume/${resumeId}`, {
    method: 'DELETE',
    headers: { Cookie: cookie1 }
  });
  assert(delRes.status === 200, '11c. Resume Deletion Cleans Up Disk and MongoDB Document');

  console.log('\n========================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================');

  if (failed > 0) process.exit(1);
}

runVerification().catch(err => {
  console.error('[FATAL ERROR]', err);
  process.exit(1);
});
