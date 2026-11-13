/**
 * End-to-end Verification Test for Resume Analyzer Text Display
 * Tests DOCX upload, PDF upload, extraction status, word count,
 * full text retrieval via GET /api/resume/:id, and cross-student access denial.
 */
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const BASE_URL = 'http://localhost:5000';

// Generate a valid .docx buffer with paragraphs and line breaks
async function createSampleDocxBuffer() {
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

  const documentXml = 
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n' +
    '  <w:body>\n' +
    '    <w:p><w:r><w:t>Priya Sharma - Frontend Engineer</w:t></w:r></w:p>\n' +
    '    <w:p><w:r><w:t>Summary: 2nd Year Computer Science student passionate about UI engineering and accessible web standards.</w:t></w:r></w:p>\n' +
    '    <w:p><w:r><w:t>Technical Skills: React, JavaScript, HTML5, CSS3, Tailwind CSS, Git, and REST APIs.</w:t></w:r></w:p>\n' +
    '    <w:p><w:r><w:t>Education: B.Tech in CSE at National Institute of Technology, expected graduation 2026, CGPA: 8.9.</w:t></w:r></w:p>\n' +
    '    <w:p><w:r><w:t>Projects: SkillBridge learning platform frontend and campus event management dashboard.</w:t></w:r></w:p>\n' +
    '  </w:body>\n' +
    '</w:document>';

  zip.file('[Content_Types].xml', contentTypesXml);
  zip.file('_rels/.rels', relsXml);
  zip.file('word/document.xml', documentXml);

  return await zip.generateAsync({ type: 'nodebuffer' });
}

// Generate a valid minimal PDF buffer with Helvetica font
function createSamplePdfBuffer() {
  const streamData = 'BT\n/F1 12 Tf\n72 712 Td\n(Rohan Verma - Full Stack Software Engineer React Node MongoDB Git) Tj\nET';
  const len = Buffer.byteLength(streamData, 'latin1');

  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';
  const obj4 = '4 0 obj\n<< /Length ' + len + ' >>\nstream\n' + streamData + '\nendstream\nendobj\n';
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

  const header = '%PDF-1.4\n';
  const o1 = Buffer.byteLength(header, 'latin1');
  const o2 = o1 + Buffer.byteLength(obj1, 'latin1');
  const o3 = o2 + Buffer.byteLength(obj2, 'latin1');
  const o4 = o3 + Buffer.byteLength(obj3, 'latin1');
  const o5 = o4 + Buffer.byteLength(obj4, 'latin1');
  const startxref = o5 + Buffer.byteLength(obj5, 'latin1');

  const pad = (n) => String(n).padStart(10, '0');
  const xref = 'xref\n0 6\n0000000000 65535 f \n' +
    pad(o1) + ' 00000 n \n' +
    pad(o2) + ' 00000 n \n' +
    pad(o3) + ' 00000 n \n' +
    pad(o4) + ' 00000 n \n' +
    pad(o5) + ' 00000 n \n';

  const trailer = 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + startxref + '\n%%EOF\n';

  return Buffer.from(header + obj1 + obj2 + obj3 + obj4 + obj5 + xref + trailer, 'latin1');
}

async function runResumeFeatureTests() {
  console.log('========================================================');
  console.log('   RESUME ANALYZER TEXT DISPLAY & ACCESS CONTROL TESTS  ');
  console.log('========================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} ${details}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  const student1Email = `student1.${timestamp}@college.edu`;
  const student2Email = `student2.${timestamp}@college.edu`;

  let student1Cookie = '';
  let student2Cookie = '';
  let docxResumeId = '';
  let pdfResumeId = '';

  try {
    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'ok', '1. Backend Health Check OK');

    // 2. Register Student 1
    const reg1Res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Priya Sharma',
        email: student1Email,
        password: 'password123',
        college: 'National Institute of Technology',
        academicYear: 'Second Year',
        semester: 'Semester 4'
      })
    });
    student1Cookie = reg1Res.headers.get('set-cookie')?.split(';')[0] || '';
    assert(reg1Res.status === 201 && !!student1Cookie, '2. Student 1 Registered & Authenticated with HttpOnly Cookie');

    // 3. Upload DOCX resume
    const docxBuf = await createSampleDocxBuffer();
    const docxFormData = new FormData();
    docxFormData.append('targetRole', 'Frontend Developer');
    docxFormData.append('resume', new Blob([docxBuf], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), 'priya_resume.docx');

    const docxUploadRes = await fetch(`${BASE_URL}/api/resume/upload`, {
      method: 'POST',
      headers: { Cookie: student1Cookie },
      body: docxFormData
    });
    const docxUploadData = await docxUploadRes.json();
    assert(
      docxUploadRes.status === 201 &&
      docxUploadData.success &&
      docxUploadData.resume.fileType === 'docx',
      '3. DOCX Resume Uploaded & Processed Successfully'
    );

    docxResumeId = docxUploadData.resume._id;

    // 4. Confirm extraction status and word count in upload response
    assert(
      docxUploadData.resume.extractionStatus === 'success' &&
      docxUploadData.resume.wordCount > 30,
      `4. DOCX Extraction Status: "${docxUploadData.resume.extractionStatus}", Word Count: ${docxUploadData.resume.wordCount}`
    );

    // 5. Fetch Student 1 resume summary list
    const listRes = await fetch(`${BASE_URL}/api/resume`, {
      headers: { Cookie: student1Cookie }
    });
    const listData = await listRes.json();
    const listedDocx = listData.resumes.find(r => r._id === docxResumeId);
    assert(
      listRes.status === 200 &&
      !!listedDocx &&
      listedDocx.extractionStatus === 'success' &&
      listedDocx.wordCount > 0 &&
      listedDocx.extractedText === undefined, // Lightweight list excludes full text
      '5. Resume List Returns Extraction Status & Word Count (excludes full text from summary)'
    );

    // 6. Call GET /api/resume/:id to fetch full extracted text
    const getDocxRes = await fetch(`${BASE_URL}/api/resume/${docxResumeId}`, {
      headers: { Cookie: student1Cookie }
    });
    const getDocxData = await getDocxRes.json();
    assert(
      getDocxRes.status === 200 &&
      getDocxData.success &&
      typeof getDocxData.resume.extractedText === 'string' &&
      getDocxData.resume.extractedText.includes('Priya Sharma - Frontend Engineer') &&
      getDocxData.resume.extractedText.includes('React, JavaScript, HTML5') &&
      getDocxData.resume.extractedText.includes('National Institute of Technology'),
      '6. Full DOCX Extracted Text Retrieved via GET /api/resume/:id with Preserved Spacing'
    );

    // 7. Upload PDF resume
    const pdfBuf = createSamplePdfBuffer();
    const pdfFormData = new FormData();
    pdfFormData.append('targetRole', 'Full Stack Developer');
    pdfFormData.append('resume', new Blob([pdfBuf], { type: 'application/pdf' }), 'rohan_resume.pdf');

    const pdfUploadRes = await fetch(`${BASE_URL}/api/resume/upload`, {
      method: 'POST',
      headers: { Cookie: student1Cookie },
      body: pdfFormData
    });
    const pdfUploadData = await pdfUploadRes.json();
    pdfResumeId = pdfUploadData.resume._id;

    assert(
      pdfUploadRes.status === 201 &&
      pdfUploadData.resume.fileType === 'pdf' &&
      pdfUploadData.resume.extractionStatus === 'success' &&
      pdfUploadData.resume.wordCount > 0,
      `7. PDF Resume Uploaded with Status: "${pdfUploadData.resume.extractionStatus}" and Word Count: ${pdfUploadData.resume.wordCount}`
    );

    // 8. Retrieve full PDF extracted text via GET /api/resume/:id
    const getPdfRes = await fetch(`${BASE_URL}/api/resume/${pdfResumeId}`, {
      headers: { Cookie: student1Cookie }
    });
    const getPdfData = await getPdfRes.json();
    assert(
      getPdfRes.status === 200 &&
      getPdfData.resume.extractedText.includes('Rohan Verma - Full Stack Software Engineer') &&
      getPdfData.resume.extractedText.includes('React Node MongoDB Git'),
      '8. Full PDF Extracted Text Retrieved via GET /api/resume/:id'
    );

    // 9. Register Student 2 for cross-tenant access control check
    const reg2Res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Arjun Mehta',
        email: student2Email,
        password: 'password123',
        college: 'IIT Delhi',
        academicYear: 'Third Year',
        semester: 'Semester 5'
      })
    });
    student2Cookie = reg2Res.headers.get('set-cookie')?.split(';')[0] || '';
    assert(reg2Res.status === 201 && !!student2Cookie, '9. Student 2 Registered for Tenant Security Verification');

    // 10. Student 2 attempts to fetch Student 1's resume details / text
    const unauthorizedRes = await fetch(`${BASE_URL}/api/resume/${docxResumeId}`, {
      headers: { Cookie: student2Cookie }
    });
    const unauthorizedData = await unauthorizedRes.json();
    assert(
      unauthorizedRes.status === 403 &&
      unauthorizedData.success === false &&
      unauthorizedData.message.includes('Access denied'),
      '10. Security: Student 2 Forbidden (403) from Accessing Student 1 Resume or Extracted Text'
    );

    // 11. Cleanup: Student 1 deletes both uploaded resumes
    const delDocx = await fetch(`${BASE_URL}/api/resume/${docxResumeId}`, {
      method: 'DELETE',
      headers: { Cookie: student1Cookie }
    });
    const delPdf = await fetch(`${BASE_URL}/api/resume/${pdfResumeId}`, {
      method: 'DELETE',
      headers: { Cookie: student1Cookie }
    });
    assert(delDocx.status === 200 && delPdf.status === 200, '11. Cleanup: Both Test Resumes Deleted from Server and DB');

  } catch (err) {
    console.error('Test execution exception:', err);
    failed++;
  }

  console.log('========================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runResumeFeatureTests();
