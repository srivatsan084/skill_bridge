/**
 * Comprehensive automated test script for SkillBridge backend APIs using Node 24 native fetch & FormData
 */
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';

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

async function runTests() {
  console.log('--- STARTING BACKEND INTEGRATION TESTS ---');
  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${message}`);
      failCount++;
    }
  }

  const testEmail1 = `test.student.${Date.now()}@college.edu`;
  const testEmail2 = `test.student.other.${Date.now()}@college.edu`;
  let studentCookie = '';
  let otherStudentCookie = '';
  let uploadedResumeId = '';
  let uploadedFilePath = '';

  try {
    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'ok', '1. Server Health Check');

    // 2. Register Student 1
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rohan Verma',
        email: testEmail1,
        password: 'password123',
        college: 'Delhi Technological University',
        academicYear: 'Second Year',
        semester: 'Semester 4',
        targetRole: 'Full Stack Developer'
      })
    });
    const regData = await regRes.json();
    const rawCookie = regRes.headers.get('set-cookie');
    studentCookie = rawCookie ? rawCookie.split(';')[0] : '';

    assert(
      regRes.status === 201 && regData.success && regData.student.email === testEmail1,
      '2. Student Registration'
    );
    assert(studentCookie.includes('token='), '3. HttpOnly Cookie received upon registration');

    // 4. Duplicate email rejected
    const dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rohan Duplicate',
        email: testEmail1,
        password: 'password123'
      })
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 400 && !dupData.success, '4. Duplicate Email Rejection');

    // 5. Login with invalid password rejected
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail1,
        password: 'wrongpassword'
      })
    });
    const badLoginData = await badLoginRes.json();
    assert(badLoginRes.status === 401 && !badLoginData.success, '5. Invalid Password Rejection');

    // 6. Login with valid password
    const goodLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail1,
        password: 'password123'
      })
    });
    const goodLoginData = await goodLoginRes.json();
    const goodCookie = goodLoginRes.headers.get('set-cookie');
    studentCookie = goodCookie ? goodCookie.split(';')[0] : studentCookie;
    assert(
      goodLoginRes.status === 200 && goodLoginData.success && goodLoginData.student.email === testEmail1,
      '6. Valid Login & Session Cookie'
    );

    // 7. GET /api/auth/me (Protected route test)
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: studentCookie }
    });
    const meData = await meRes.json();
    assert(
      meRes.status === 200 && meData.student.name === 'Rohan Verma',
      '7. Protected Route /api/auth/me Session Validation'
    );

    // 8. Unauthorized access rejected without token
    const noAuthRes = await fetch(`${BASE_URL}/api/auth/me`);
    const noAuthData = await noAuthRes.json();
    assert(noAuthRes.status === 401 && !noAuthData.success, '8. Unauthorized Access Rejection (No Cookie)');

    // 9. Update Profile (PUT /api/profile)
    const updateRes = await fetch(`${BASE_URL}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: studentCookie
      },
      body: JSON.stringify({
        skills: [
          { name: 'JavaScript', category: 'Programming', level: 'Intermediate' },
          { name: 'React', category: 'Frontend', level: 'Intermediate' },
          { name: 'Node.js', category: 'Backend', level: 'Beginner' }
        ],
        isOnboarded: true,
        targetRole: 'Full Stack Developer',
        bio: 'Aspiring MERN stack software engineer'
      })
    });
    const updateData = await updateRes.json();
    assert(
      updateRes.status === 200 &&
      updateData.student.skills.length === 3 &&
      updateData.student.isOnboarded === true,
      '9. Profile Update and Persistence in MongoDB'
    );

    // 10. GET /api/profile/status
    const statusRes = await fetch(`${BASE_URL}/api/profile/status`, {
      headers: { Cookie: studentCookie }
    });
    const statusData = await statusRes.json();
    assert(
      statusRes.status === 200 && statusData.status.isOnboarded === true && statusData.status.skillsCount === 3,
      '10. Profile Status API returns accurate metrics'
    );

    // 11. Register Student 2 (for multi-tenant access restriction checks)
    const reg2Res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Priya Patel',
        email: testEmail2,
        password: 'password123'
      })
    });
    const rawCookie2 = reg2Res.headers.get('set-cookie');
    otherStudentCookie = rawCookie2 ? rawCookie2.split(';')[0] : '';
    assert(reg2Res.status === 201, '11. Second Student Registered for multi-tenant checks');

    // 12. Upload valid PDF Resume using native FormData
    const pdfBuf = createSamplePdfBuffer();

    const pdfFormData = new FormData();
    pdfFormData.append('targetRole', 'Full Stack Developer');
    pdfFormData.append('resume', new Blob([pdfBuf], { type: 'application/pdf' }), 'rohan_resume.pdf');

    const pdfUploadRes = await fetch(`${BASE_URL}/api/resume/upload`, {
      method: 'POST',
      headers: { Cookie: studentCookie },
      body: pdfFormData
    });
    const pdfUploadData = await pdfUploadRes.json();
    console.log('UPLOAD STATUS:', pdfUploadRes.status, 'UPLOAD DATA:', pdfUploadData);

    assert(
      pdfUploadRes.status === 201 &&
      pdfUploadData.success &&
      pdfUploadData.resume.extractedText.includes('Rohan Verma'),
      '12. PDF Resume Upload and Text Extraction'
    );

    uploadedResumeId = pdfUploadData.resume._id;
    uploadedFilePath = pdfUploadData.resume.filePath;

    // 13. File exists on disk in backend/uploads
    assert(fs.existsSync(uploadedFilePath), '13. Uploaded file securely saved in uploads directory');

    // 14. GET /api/resume (List resumes for student 1)
    const listRes = await fetch(`${BASE_URL}/api/resume`, {
      headers: { Cookie: studentCookie }
    });
    const listData = await listRes.json();
    assert(
      listRes.status === 200 && listData.count >= 1 && listData.resumes[0]._id === uploadedResumeId,
      '14. List Student Resumes'
    );

    // 15. Student 2 cannot access Student 1's resume (403 Forbidden)
    const accessOtherRes = await fetch(`${BASE_URL}/api/resume/${uploadedResumeId}`, {
      headers: { Cookie: otherStudentCookie }
    });
    const accessOtherData = await accessOtherRes.json();
    assert(
      accessOtherRes.status === 403 && !accessOtherData.success,
      '15. Cross-Student Resume Access Denied (403 Forbidden)'
    );

    // 16. Reject invalid file format (e.g. .txt)
    const txtFormData = new FormData();
    txtFormData.append('targetRole', 'Frontend Developer');
    txtFormData.append('resume', new Blob(['hello plain text'], { type: 'text/plain' }), 'fake.txt');

    const badFileRes = await fetch(`${BASE_URL}/api/resume/upload`, {
      method: 'POST',
      headers: { Cookie: studentCookie },
      body: txtFormData
    });
    const badFileData = await badFileRes.json();
    assert(
      badFileRes.status === 400 || badFileRes.status === 500,
      '16. Invalid File Format (.txt) Rejected'
    );

    // 17. Reject oversized file (> 5 MB)
    const oversizedBuffer = Buffer.alloc(5.2 * 1024 * 1024, 0); // 5.2 MB
    const oversizedFormData = new FormData();
    oversizedFormData.append('targetRole', 'Frontend Developer');
    oversizedFormData.append('resume', new Blob([oversizedBuffer], { type: 'application/pdf' }), 'large.pdf');

    const oversizedRes = await fetch(`${BASE_URL}/api/resume/upload`, {
      method: 'POST',
      headers: { Cookie: studentCookie },
      body: oversizedFormData
    });
    const oversizedData = await oversizedRes.json();
    assert(
      oversizedRes.status === 400 && !oversizedData.success,
      '17. Oversized File (> 5 MB) Rejected by Multer'
    );

    // 18. Delete Resume (DELETE /api/resume/:id)
    const delRes = await fetch(`${BASE_URL}/api/resume/${uploadedResumeId}`, {
      method: 'DELETE',
      headers: { Cookie: studentCookie }
    });
    const delData = await delRes.json();
    assert(delRes.status === 200 && delData.success, '18. Resume Record Deleted from MongoDB');
    assert(!fs.existsSync(uploadedFilePath), '19. Resume File Removed from Server Disk');

    // 20. Logout
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: studentCookie }
    });
    const logoutData = await logoutRes.json();
    assert(
      logoutRes.status === 200 && logoutData.success,
      '20. Student Logout and Cookie Invalidation'
    );

  } catch (err) {
    console.error('Test execution error:', err);
    failCount++;
  }

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log(`========================================\n`);

  process.exit(failCount === 0 ? 0 : 1);
}

runTests();
