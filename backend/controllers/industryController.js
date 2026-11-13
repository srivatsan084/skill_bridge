const IndustryRoleProfile = require('../models/IndustryRoleProfile');

/**
 * @desc    Get all available industry career roles and posting counts
 * @route   GET /api/industry/roles
 * @access  Public
 */
const getIndustryRoles = async (req, res, next) => {
  try {
    const roles = await IndustryRoleProfile.find(
      {},
      'role roleSlug totalPostings skills datasetSource processedAt updatedAt'
    )
      .sort({ totalPostings: -1 })
      .lean();

    const totalPostingsAnalyzed = roles.reduce((sum, r) => sum + (r.totalPostings || 0), 0);

    const formattedRoles = roles.map((r) => ({
      role: r.role,
      roleSlug: r.roleSlug,
      totalPostings: r.totalPostings,
      skillCount: r.skills ? r.skills.length : 0,
      processedAt: r.processedAt,
      updatedAt: r.updatedAt
    }));

    res.status(200).json({
      success: true,
      count: roles.length,
      totalPostingsAnalyzed,
      datasetSource: roles[0]?.datasetSource || 'Kaggle LinkedIn Job Postings Dataset',
      roles: formattedRoles
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get skill statistics for a specific industry career role
 * @route   GET /api/industry/roles/:role/skills
 * @access  Public
 */
const getIndustryRoleSkills = async (req, res, next) => {
  try {
    const requestedParam = req.params.role ? req.params.role.trim() : '';

    if (!requestedParam) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a career role name or slug.'
      });
    }

    const slug = IndustryRoleProfile.slugifyRole(requestedParam);

    // Escape regex characters if querying by name
    const escapedParam = requestedParam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Match by slug or exact case-insensitive role name
    const profile = await IndustryRoleProfile.findOne({
      $or: [
        { roleSlug: slug },
        { role: new RegExp(`^${escapedParam}$`, 'i') }
      ]
    }).lean();

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: `Career role '${requestedParam}' not found in industry dataset. Available roles can be retrieved from /api/industry/roles.`
      });
    }

    res.status(200).json({
      success: true,
      role: profile.role,
      roleSlug: profile.roleSlug,
      totalPostings: profile.totalPostings,
      datasetSource: profile.datasetSource,
      processedAt: profile.processedAt,
      updatedAt: profile.updatedAt,
      totalSkills: profile.skills ? profile.skills.length : 0,
      sampleDisclaimer: `Analysis based on ${profile.totalPostings} relevant job postings in the ${profile.datasetSource}. Skill frequencies reflect market demand and are not mandatory requirements.`,
      skills: profile.skills || []
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getIndustryRoles,
  getIndustryRoleSkills
};
