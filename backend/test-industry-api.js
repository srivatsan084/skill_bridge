/**
 * Automated Verification Test Suite for Industry Skills Integration
 * Tests:
 * 1. Dataset import of all 13 role profiles
 * 2. Idempotency (running import twice produces 0 duplicate records)
 * 3. Handling missing dataset files & invalid JSON
 * 4. GET /api/industry/roles endpoint
 * 5. GET /api/industry/roles/:role/skills for Full Stack Developer (by slug & by name)
 * 6. Handling unavailable / invalid roles (404 status)
 * 7. Ensuring zero student information leakage
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const { importIndustryData } = require('./scripts/importIndustryData');
const IndustryRoleProfile = require('./models/IndustryRoleProfile');

const BASE_URL = 'http://localhost:5000';

async function runIndustryTests() {
  console.log('========================================================');
  console.log('   INDUSTRY SKILLS DATASET & API INTEGRATION TESTS      ');
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

  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    'mongodb://127.0.0.1:27017/skillbridge';

  try {
    // -----------------------------------------------------------
    // TEST 1: Direct Import of 13 Roles
    // -----------------------------------------------------------
    const firstImport = await importIndustryData({ disconnectOnFinish: false });
    assert(
      firstImport.success &&
      firstImport.totalImportedRoles === 13 &&
      firstImport.relevantUniquePostings === 3804 &&
      firstImport.totalSkillsCount === 507,
      '1. Import All 13 Industry Role Profiles from JSON Summary'
    );

    // -----------------------------------------------------------
    // TEST 2: Idempotency (Second Import run produces 0 duplicates)
    // -----------------------------------------------------------
    const secondImport = await importIndustryData({ disconnectOnFinish: false });
    const totalDocsInDb = await IndustryRoleProfile.countDocuments();
    assert(
      secondImport.success &&
      secondImport.created === 0 &&
      secondImport.updated === 13 &&
      totalDocsInDb === 13,
      '2. Idempotency: Re-running Import Updates 13 Roles with 0 Duplicates'
    );

    // -----------------------------------------------------------
    // TEST 3: Handling Missing File Error
    // -----------------------------------------------------------
    let missingFileErrorCaught = false;
    try {
      await importIndustryData({
        disconnectOnFinish: false,
        customFilePath: path.join(__dirname, 'non_existent_dataset.json')
      });
    } catch (err) {
      missingFileErrorCaught = err.message.includes('Missing dataset file') || err.message.includes('Failed to read');
    }
    assert(missingFileErrorCaught, '3. Error Handling: Missing Dataset File Throws Descriptive Error');

    // -----------------------------------------------------------
    // TEST 4: Handling Malformed JSON Error
    // -----------------------------------------------------------
    const tempBadJsonPath = path.join(__dirname, 'temp_bad_syntax.json');
    fs.writeFileSync(tempBadJsonPath, '{ "broken": json syntax here ...');
    let malformedJsonErrorCaught = false;
    try {
      await importIndustryData({
        disconnectOnFinish: false,
        customFilePath: tempBadJsonPath
      });
    } catch (err) {
      malformedJsonErrorCaught = err.message.includes('Invalid JSON format');
    } finally {
      if (fs.existsSync(tempBadJsonPath)) {
        fs.unlinkSync(tempBadJsonPath);
      }
    }
    assert(malformedJsonErrorCaught, '4. Error Handling: Invalid JSON Format Throws Handled Error');

    // -----------------------------------------------------------
    // TEST 5: API Server Health
    // -----------------------------------------------------------
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'ok', '5. Backend Server Online and Healthy');

    // -----------------------------------------------------------
    // TEST 6: GET /api/industry/roles
    // -----------------------------------------------------------
    const rolesRes = await fetch(`${BASE_URL}/api/industry/roles`);
    const rolesData = await rolesRes.json();

    const hasAllRoles = rolesData.roles && rolesData.roles.length === 13;
    const softwareEngineer = rolesData.roles?.find(r => r.role === 'Software Engineer');
    const fullStack = rolesData.roles?.find(r => r.role === 'Full Stack Developer');

    assert(
      rolesRes.status === 200 &&
      rolesData.success === true &&
      rolesData.count === 13 &&
      rolesData.totalPostingsAnalyzed === 3804 &&
      hasAllRoles &&
      softwareEngineer?.totalPostings === 1271 &&
      fullStack?.totalPostings === 420,
      '6. GET /api/industry/roles Returns 13 Roles and 3,804 Total Postings'
    );

    // -----------------------------------------------------------
    // TEST 7: Zero Student Data Exposure in Public Roles API
    // -----------------------------------------------------------
    const stringifiedRoles = JSON.stringify(rolesData);
    const hasStudentLeak =
      stringifiedRoles.includes('password') ||
      stringifiedRoles.includes('student') ||
      stringifiedRoles.includes('email@');
    assert(!hasStudentLeak, '7. Security: Zero Student Data Exposed in Industry Roles Endpoint');

    // -----------------------------------------------------------
    // TEST 8: GET /api/industry/roles/:role/skills (by Slug)
    // -----------------------------------------------------------
    const fsSlugRes = await fetch(`${BASE_URL}/api/industry/roles/full-stack-developer/skills`);
    const fsSlugData = await fsSlugRes.json();

    const topSkills = fsSlugData.skills || [];
    const jsSkill = topSkills.find(s => s.skill.toLowerCase() === 'javascript');
    const reactSkill = topSkills.find(s => s.skill.toLowerCase() === 'react');

    assert(
      fsSlugRes.status === 200 &&
      fsSlugData.success === true &&
      fsSlugData.role === 'Full Stack Developer' &&
      fsSlugData.roleSlug === 'full-stack-developer' &&
      fsSlugData.totalPostings === 420 &&
      topSkills.length === 51 &&
      jsSkill &&
      jsSkill.mentionCount > 0 &&
      reactSkill &&
      reactSkill.mentionCount > 0,
      `8. GET /api/industry/roles/full-stack-developer/skills Returns 51 Skills (JS: ${jsSkill?.mentionCount} postings / ${jsSkill?.percentage}%)`
    );

    // -----------------------------------------------------------
    // TEST 9: Non-Mandatory Advisory Wording / Dataset Source Verification
    // -----------------------------------------------------------
    const disclaimerCorrect =
      fsSlugData.sampleDisclaimer &&
      fsSlugData.sampleDisclaimer.includes('420') &&
      fsSlugData.sampleDisclaimer.includes('not mandatory');
    assert(
      disclaimerCorrect && fsSlugData.datasetSource.includes('LinkedIn'),
      '9. Data Integrity: Accurate Sample Size (420) & Non-Mandatory Market Demand Wording'
    );

    // -----------------------------------------------------------
    // TEST 10: GET /api/industry/roles/:role/skills (by Title with Spaces)
    // -----------------------------------------------------------
    const fsNameRes = await fetch(`${BASE_URL}/api/industry/roles/Full%20Stack%20Developer/skills`);
    const fsNameData = await fsNameRes.json();
    assert(
      fsNameRes.status === 200 &&
      fsNameData.success === true &&
      fsNameData.totalPostings === 420 &&
      fsNameData.skills?.length === 51,
      '10. GET /api/industry/roles/:role/skills Supports Raw Role Name with URL Encoding'
    );

    // -----------------------------------------------------------
    // TEST 11: GET /api/industry/roles/:role/skills (Frontend Developer)
    // -----------------------------------------------------------
    const feRes = await fetch(`${BASE_URL}/api/industry/roles/frontend-developer/skills`);
    const feData = await feRes.json();
    assert(
      feRes.status === 200 &&
      feData.role === 'Frontend Developer' &&
      feData.totalPostings === 263 &&
      feData.skills?.length === 45,
      '11. GET /api/industry/roles/frontend-developer/skills Returns 263 Postings & 45 Skills'
    );

    // -----------------------------------------------------------
    // TEST 12: GET /api/industry/roles/:role/skills (404 for Unavailable Role)
    // -----------------------------------------------------------
    const missingRoleRes = await fetch(`${BASE_URL}/api/industry/roles/quantum-computing-specialist/skills`);
    const missingRoleData = await missingRoleRes.json();
    assert(
      missingRoleRes.status === 404 &&
      missingRoleData.success === false &&
      missingRoleData.message.includes('not found in industry dataset'),
      '12. Error Handling: Unavailable Role Returns Clean 404 with Helpful Pointer'
    );

    // -----------------------------------------------------------
    // TEST 13: Backward Compatibility with Auth, Profile & Resume Routes
    // -----------------------------------------------------------
    const authMeNoToken = await fetch(`${BASE_URL}/api/auth/me`);
    const resumeNoToken = await fetch(`${BASE_URL}/api/resume`);
    assert(
      authMeNoToken.status === 401 && resumeNoToken.status === 401,
      '13. Regression Check: Existing Student Auth & Resume Endpoints Remain Strictly Protected'
    );

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }

  console.log('========================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runIndustryTests();
