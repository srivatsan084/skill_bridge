const mongoose = require('mongoose');

const skillStatisticSchema = new mongoose.Schema(
  {
    skill: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true
    },
    // Number of postings mentioning this skill
    mentionCount: {
      type: Number,
      required: [true, 'Mention count is required'],
      min: [0, 'Mention count cannot be negative']
    },
    // Percentage of postings mentioning this skill (0 - 100)
    percentage: {
      type: Number,
      required: [true, 'Percentage is required'],
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100']
    }
  },
  { _id: false }
);

const industryRoleProfileSchema = new mongoose.Schema(
  {
    // Canonical display name of the career role (e.g., "Full Stack Developer")
    role: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true,
      index: true
    },
    // Normalized URL-friendly slug (e.g., "full-stack-developer")
    roleSlug: {
      type: String,
      required: [true, 'Role slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    // Total job postings analyzed for this role in the dataset
    totalPostings: {
      type: Number,
      required: [true, 'Total postings count is required'],
      min: [0, 'Total postings cannot be negative']
    },
    // List of skills identified in job postings for this role
    skills: {
      type: [skillStatisticSchema],
      default: []
    },
    // Source of the dataset
    datasetSource: {
      type: String,
      default: 'Kaggle LinkedIn Job Postings Dataset',
      trim: true
    },
    // Timestamp when data was processed by the extraction pipeline
    processedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Helper function to create URL-friendly slug from role name
industryRoleProfileSchema.statics.slugifyRole = function (roleName) {
  if (!roleName || typeof roleName !== 'string') return '';
  return roleName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

module.exports = mongoose.model('IndustryRoleProfile', industryRoleProfileSchema);
