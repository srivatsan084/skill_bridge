const express = require('express');
const router = express.Router();

const {
  getIndustryRoles,
  getIndustryRoleSkills
} = require('../controllers/industryController');

// Public read-only industry skill data endpoints
router.get('/roles', getIndustryRoles);
router.get('/roles/:role/skills', getIndustryRoleSkills);

module.exports = router;
