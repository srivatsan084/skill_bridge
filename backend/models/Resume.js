const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  originalFilename: {
    type: String,
    required: true,
    trim: true
  },
  storedFilename: {
    type: String,
    required: true,
    trim: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true,
    enum: ['pdf', 'docx']
  },
  mimeType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  targetRole: {
    type: String,
    required: [true, 'Please select a target career role for resume analysis'],
    trim: true
  },
  extractedText: {
    type: String,
    required: true
  },
  wordCount: {
    type: Number,
    default: 0
  },
  extractionStatus: {
    type: String,
    enum: ['success', 'partial', 'failed'],
    default: 'success'
  },
  extractedSkills: {
    type: [String],
    default: []
  },
  skillExtractionStatus: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  skillExtractionProcessedAt: {
    type: Date
  },
  skillExtractionError: {
    type: String,
    default: null
  },
  skillGapAnalysis: {
    role: { type: String },
    roleSlug: { type: String },
    totalPostings: { type: Number },
    datasetSource: { type: String },
    matchedSkills: [
      {
        skill: { type: String, required: true },
        mentionCount: { type: Number, required: true },
        percentage: { type: Number, required: true },
        industryMentionCount: { type: Number },
        industryMentionPercentage: { type: Number }
      }
    ],
    missingSkills: [
      {
        skill: { type: String, required: true },
        mentionCount: { type: Number, required: true },
        percentage: { type: Number, required: true },
        industryMentionCount: { type: Number },
        industryMentionPercentage: { type: Number },
        frequencyCategory: { type: String }
      }
    ],
    resumeOnlySkills: [
      {
        skill: { type: String, required: true },
        explanation: { type: String },
        note: { type: String }
      }
    ],
    summary: {
      matchedCount: { type: Number, default: 0 },
      missingCount: { type: Number, default: 0 },
      resumeOnlyCount: { type: Number, default: 0 },
      totalIndustrySkills: { type: Number, default: 0 },
      totalResumeSkills: { type: Number, default: 0 },
      totalPostings: { type: Number, default: 0 }
    },
    advisoryDisclaimer: { type: String },
    analyzedAt: { type: Date }
  },
  rewriteResult: {
    targetRole: { type: String },
    professionalSummary: {
      hasOriginalSummary: { type: Boolean, default: false },
      improvedSummary: { type: String, default: '' },
      summaryNotes: { type: String }
    },
    improvedProjects: [
      {
        originalTitle: { type: String },
        improvedTitle: { type: String },
        originalPoints: { type: [String], default: [] },
        improvedPoints: { type: [String], default: [] },
        skillsUsed: { type: [String], default: [] }
      }
    ],
    improvedExperience: [
      {
        originalRole: { type: String },
        improvedRole: { type: String },
        originalCompany: { type: String },
        improvedPoints: { type: [String], default: [] }
      }
    ],
    improvedSkillsPresentation: {
      categorizedSkills: [
        {
          category: { type: String },
          skills: { type: [String], default: [] }
        }
      ],
      presentationTips: { type: String }
    },
    suggestionsForMissingInfo: {
      type: [String],
      default: []
    },
    verificationWarning: {
      type: String,
      default: 'Please review and verify all generated wording before adding it to your resume. The AI improves phrasing but cannot verify factual accuracy. Never claim skills or achievements you have not performed.'
    },
    modelUsed: { type: String },
    generatedAt: { type: Date }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Resume', resumeSchema);
