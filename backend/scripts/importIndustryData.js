/**
 * Idempotent Dataset Import Script for SkillBridge Industry Skills
 * Reads dataset/processed/role_skill_summary.json and imports/upserts
 * industry role profiles into MongoDB.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment configuration
dotenv.config({ path: path.join(__dirname, '../.env') });

const IndustryRoleProfile = require('../models/IndustryRoleProfile');

/**
 * Finds the processed role_skill_summary.json file across standard workspace paths
 */
function findSummaryFilePath() {
  const potentialPaths = [
    path.resolve(__dirname, '../../dataset/processed/role_skill_summary.json'),
    path.resolve(process.cwd(), 'dataset/processed/role_skill_summary.json'),
    path.resolve(process.cwd(), '../dataset/processed/role_skill_summary.json')
  ];

  for (const candidate of potentialPaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Main import function
 * @param {Object} [options]
 * @param {boolean} [options.disconnectOnFinish=true] Whether to close mongoose connection on completion
 * @param {string} [options.customFilePath] Optional custom path to summary json
 * @returns {Promise<Object>} Import execution summary
 */
async function importIndustryData(options = {}) {
  const { disconnectOnFinish = true, customFilePath = null } = options;

  console.log('[Dataset Import] Starting industry role skill summary import...');

  // 1. Locate file
  const filePath = customFilePath || findSummaryFilePath();
  if (!filePath) {
    throw new Error(
      'Missing dataset file: Unable to find "dataset/processed/role_skill_summary.json". ' +
        'Please verify that the processed dataset exists.'
    );
  }

  console.log(`[Dataset Import] Reading dataset from: ${filePath}`);

  // 2. Read and parse JSON safely
  let rawContent;
  try {
    rawContent = fs.readFileSync(filePath, 'utf8');
  } catch (readErr) {
    throw new Error(`Failed to read dataset file: ${readErr.message}`);
  }

  let datasetJson;
  try {
    datasetJson = JSON.parse(rawContent);
  } catch (jsonErr) {
    throw new Error(`Invalid JSON format in dataset file: ${jsonErr.message}`);
  }

  // 3. Validate expected structure
  if (!datasetJson.role_posting_counts || typeof datasetJson.role_posting_counts !== 'object') {
    throw new Error('Dataset JSON is missing or has an invalid "role_posting_counts" object.');
  }

  if (!Array.isArray(datasetJson.skill_results)) {
    throw new Error('Dataset JSON is missing or has an invalid "skill_results" array.');
  }

  const {
    source = 'Kaggle LinkedIn Job Postings Dataset',
    processed_at,
    relevant_unique_postings = 0,
    role_posting_counts,
    skill_results
  } = datasetJson;

  const processedDate = processed_at ? new Date(processed_at) : new Date();

  // 4. Group skill results by career role
  const skillsByRole = {};
  for (const item of skill_results) {
    const roleName = item.role?.trim();
    const skillName = item.skill?.trim();
    const mentionCount = Number(item.postings_with_skill ?? item.mentionCount ?? 0);
    const percentage = Number(item.percentage ?? 0);

    if (!roleName || !skillName) continue;

    if (!skillsByRole[roleName]) {
      skillsByRole[roleName] = [];
    }

    skillsByRole[roleName].push({
      skill: skillName,
      mentionCount,
      percentage: Math.round(percentage * 100) / 100 // Keep clean 2 decimal places
    });
  }

  // Sort each role's skills by mentionCount descending for optimal presentation
  for (const role of Object.keys(skillsByRole)) {
    skillsByRole[role].sort((a, b) => b.mentionCount - a.mentionCount || b.percentage - a.percentage);
  }

  // 5. Connect to MongoDB if not already connected
  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    'mongodb://127.0.0.1:27017/skillbridge';

  if (mongoose.connection.readyState !== 1) {
    console.log(`[Dataset Import] Connecting to MongoDB: ${mongoUri.replace(/:([^:@]{4})[^:@]*@/, ':****@')}...`);
    try {
      await mongoose.connect(mongoUri);
      console.log('[Dataset Import] MongoDB connected successfully.');
    } catch (connErr) {
      throw new Error(`MongoDB connection failed: ${connErr.message}`);
    }
  }

  // 6. Perform idempotent upsert for each career role
  const roleNames = Object.keys(role_posting_counts);
  console.log(`[Dataset Import] Found ${roleNames.length} career roles to import/update.`);

  let createdCount = 0;
  let updatedCount = 0;
  let totalSkillsImported = 0;

  for (const roleName of roleNames) {
    const roleSlug = IndustryRoleProfile.slugifyRole(roleName);
    const totalPostings = Number(role_posting_counts[roleName] || 0);
    const roleSkills = skillsByRole[roleName] || [];

    totalSkillsImported += roleSkills.length;

    // Check if role profile already exists
    const existing = await IndustryRoleProfile.findOne({ roleSlug });

    const updateDoc = {
      role: roleName,
      roleSlug,
      totalPostings,
      skills: roleSkills,
      datasetSource: source,
      processedAt: processedDate
    };

    await IndustryRoleProfile.findOneAndUpdate(
      { roleSlug },
      { $set: updateDoc },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (existing) {
      updatedCount++;
    } else {
      createdCount++;
    }
  }

  const summary = {
    success: true,
    source,
    relevantUniquePostings: relevant_unique_postings,
    totalRolesInDataset: roleNames.length,
    created: createdCount,
    updated: updatedCount,
    totalImportedRoles: createdCount + updatedCount,
    totalSkillsCount: totalSkillsImported
  };

  console.log('----------------------------------------------------');
  console.log('   INDUSTRY DATASET IMPORT COMPLETE');
  console.log('----------------------------------------------------');
  console.log(`- Dataset Source:         ${summary.source}`);
  console.log(`- Relevant Postings:      ${summary.relevantUniquePostings}`);
  console.log(`- Roles Created (new):    ${summary.created}`);
  console.log(`- Roles Updated:          ${summary.updated}`);
  console.log(`- Total Current Roles:    ${summary.totalImportedRoles}`);
  console.log(`- Total Skills Mapped:    ${summary.totalSkillsCount}`);
  console.log('----------------------------------------------------');

  if (disconnectOnFinish && mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
    console.log('[Dataset Import] Disconnected from MongoDB.');
  }

  return summary;
}

// Allow CLI execution: node backend/scripts/importIndustryData.js
if (require.main === module) {
  importIndustryData({ disconnectOnFinish: true })
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Dataset Import Error]:', err.message);
      process.exit(1);
    });
}

module.exports = { importIndustryData };
