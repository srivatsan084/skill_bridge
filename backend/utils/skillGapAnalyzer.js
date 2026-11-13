/**
 * SkillBridge Resume-to-Industry Skill-Gap Comparison Utility
 * Compares normalized resume skills with job posting requirements from MongoDB.
 * Categorizes skills into Matched, Missing, and Resume-Only with accurate industry statistics.
 */

const { normalizeSkill } = require('./skillExtractor');

/**
 * Categorizes industry skills by mention frequency tier
 * @param {number} percentage - Industry mention percentage
 * @returns {string} Frequency category description
 */
function getFrequencyCategory(percentage) {
  if (percentage >= 30) {
    return 'High Frequency (≥30%)';
  }
  if (percentage >= 15) {
    return 'Moderate Frequency (15-29%)';
  }
  return 'Specialized (<15%)';
}

/**
 * Compares student extracted resume skills with industry role requirements
 * @param {string[]} extractedSkills - Array of skills detected in student resume
 * @param {Array<{ skill: string, mentionCount: number, percentage: number }>} industrySkills - Skills from IndustryRoleProfile
 * @param {number} totalPostings - Total job postings analyzed for the role
 * @returns {object} Structured skill-gap comparison results
 */
function compareSkillsWithIndustry(extractedSkills = [], industrySkills = [], totalPostings = 0) {
  // 1. Build a normalized map of resume skills (keyed by lowercase canonical name)
  const normalizedResumeSkillsMap = new Map();

  if (Array.isArray(extractedSkills)) {
    for (const rawSkill of extractedSkills) {
      if (!rawSkill || typeof rawSkill !== 'string') continue;
      const canonical = normalizeSkill(rawSkill);
      if (canonical) {
        normalizedResumeSkillsMap.set(canonical.toLowerCase(), canonical);
      }
    }
  }

  // 2. Build a normalized map of industry skills
  const normalizedIndustrySkillsMap = new Map();

  if (Array.isArray(industrySkills)) {
    for (const item of industrySkills) {
      if (!item || !item.skill) continue;
      const canonical = normalizeSkill(item.skill);
      const mentionCount = Number(item.mentionCount) || 0;
      const percentage = Number(item.percentage) || 0;

      normalizedIndustrySkillsMap.set(canonical.toLowerCase(), {
        canonicalSkill: canonical,
        mentionCount,
        percentage
      });
    }
  }

  const matchedSkills = [];
  const missingSkills = [];
  const resumeOnlySkills = [];

  // 3. Partition industry skills into Matched and Missing
  for (const [lowerKey, indData] of normalizedIndustrySkillsMap.entries()) {
    if (normalizedResumeSkillsMap.has(lowerKey)) {
      matchedSkills.push({
        skill: indData.canonicalSkill,
        mentionCount: indData.mentionCount,
        percentage: indData.percentage,
        industryMentionCount: indData.mentionCount,
        industryMentionPercentage: indData.percentage
      });
    } else {
      missingSkills.push({
        skill: indData.canonicalSkill,
        mentionCount: indData.mentionCount,
        percentage: indData.percentage,
        industryMentionCount: indData.mentionCount,
        industryMentionPercentage: indData.percentage,
        frequencyCategory: getFrequencyCategory(indData.percentage)
      });
    }
  }

  // 4. Identify resume skills that do not appear in this industry role's profile
  for (const [lowerKey, resumeCanonical] of normalizedResumeSkillsMap.entries()) {
    if (!normalizedIndustrySkillsMap.has(lowerKey)) {
      resumeOnlySkills.push({
        skill: resumeCanonical,
        explanation: `Detected in your resume, but not frequently mentioned in the analyzed job postings for this role. These are valuable supplementary skills that can differentiate your candidate profile.`,
        note: `Detected in resume; not in current role dataset profile.`
      });
    }
  }

  // 5. Sort lists logically
  // Matched and Missing sorted descending by mention percentage, then count
  matchedSkills.sort((a, b) => b.percentage - a.percentage || b.mentionCount - a.mentionCount);
  missingSkills.sort((a, b) => b.percentage - a.percentage || b.mentionCount - a.mentionCount);
  // Resume-only sorted alphabetically by skill name
  resumeOnlySkills.sort((a, b) => a.skill.localeCompare(b.skill));

  return {
    matchedSkills,
    missingSkills,
    resumeOnlySkills,
    summary: {
      matchedCount: matchedSkills.length,
      missingCount: missingSkills.length,
      resumeOnlyCount: resumeOnlySkills.length,
      totalIndustrySkills: normalizedIndustrySkillsMap.size,
      totalResumeSkills: normalizedResumeSkillsMap.size,
      totalPostings: Number(totalPostings) || 0
    },
    advisoryDisclaimer: `Analysis based on ${Number(totalPostings) || 0} analyzed job postings. Industry mention percentages represent frequencies in job descriptions and are not mandatory prerequisites. Missing skills indicate technologies not detected in the uploaded resume, not an absence of student capability.`
  };
}

module.exports = {
  compareSkillsWithIndustry,
  getFrequencyCategory
};
