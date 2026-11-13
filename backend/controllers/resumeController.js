const path = require('path');
const fs = require('fs');
const Resume = require('../models/Resume');
const IndustryRoleProfile = require('../models/IndustryRoleProfile');
const { extractTextFromBuffer } = require('../utils/textExtractor');
const { extractSkillsFromText } = require('../utils/skillExtractor');
const { compareSkillsWithIndustry } = require('../utils/skillGapAnalyzer');
const { generateResumeRewrite } = require('../utils/resumeRewriter');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * @desc    Upload and extract text from student resume (PDF/DOCX)
 * @route   POST /api/resume/upload
 * @access  Private
 */
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload a PDF or DOCX file (max 5 MB).'
      });
    }

    const { targetRole } = req.body;
    if (!targetRole) {
      return res.status(400).json({
        success: false,
        message: 'Please select a target career role for this resume.'
      });
    }

    // Determine extension: 'pdf' or 'docx'
    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    const allowedExtensions = ['pdf', 'docx'];

    if (!allowedExtensions.includes(ext)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file format. Only .pdf and .docx files are permitted.'
      });
    }

    // Extract text directly from memory buffer
    let extracted;
    try {
      extracted = await extractTextFromBuffer(req.file.buffer, ext);
    } catch (extractError) {
      return res.status(422).json({
        success: false,
        message: `Failed to extract readable text: ${extractError.message}`
      });
    }

    // Generate safe filename and write to disk
    const safeStudentId = req.student ? req.student.id : 'anon';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e5)}`;
    const storedFilename = `resume-${safeStudentId}-${uniqueSuffix}.${ext}`;
    const filePath = path.join(uploadDir, storedFilename);

    fs.writeFileSync(filePath, req.file.buffer);

    // Automatically extract technical skills from extracted text
    let extractedSkills = [];
    let skillExtractionStatus = 'pending';
    let skillExtractionError = null;
    let skillExtractionProcessedAt = null;

    try {
      extractedSkills = extractSkillsFromText(extracted.text);
      skillExtractionStatus = 'success';
      skillExtractionProcessedAt = new Date();
    } catch (skillErr) {
      console.warn('[Skill Extraction Warning] Auto-extraction failed on upload:', skillErr.message);
      skillExtractionStatus = 'failed';
      skillExtractionError = skillErr.message;
      skillExtractionProcessedAt = new Date();
    }

    // Save resume record in MongoDB
    const resumeRecord = await Resume.create({
      student: req.student.id,
      originalFilename: req.file.originalname,
      storedFilename,
      filePath,
      fileType: ext,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      targetRole: targetRole.trim(),
      extractedText: extracted.text,
      wordCount: extracted.wordCount,
      extractionStatus: 'success',
      extractedSkills,
      skillExtractionStatus,
      skillExtractionProcessedAt,
      skillExtractionError
    });

    res.status(201).json({
      success: true,
      message: 'Resume uploaded and text extracted successfully.',
      resume: resumeRecord
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all resumes uploaded by the authenticated student
 * @route   GET /api/resume
 * @access  Private
 */
const getMyResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ student: req.student.id })
      .select('-extractedText') // exclude full text from summary list for lightweight payload
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: resumes.length,
      resumes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a specific resume with full extracted text
 * @route   GET /api/resume/:id
 * @access  Private
 */
const getResumeById = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found.'
      });
    }

    // Verify ownership
    if (resume.student.toString() !== req.student.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own resumes.'
      });
    }

    res.status(200).json({
      success: true,
      resume
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a resume file from disk and database record
 * @route   DELETE /api/resume/:id
 * @access  Private
 */
const deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume record not found.'
      });
    }

    // Verify ownership
    if (resume.student.toString() !== req.student.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own resumes.'
      });
    }

    // Delete file from disk if exists
    if (resume.filePath && fs.existsSync(resume.filePath)) {
      try {
        fs.unlinkSync(resume.filePath);
      } catch (err) {
        console.warn(`[File warning] Could not unlink ${resume.filePath}: ${err.message}`);
      }
    }

    // Delete MongoDB document
    await resume.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Resume and associated text data deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Extract and normalize technical skills from an uploaded resume
 * @route   POST /api/resume/:id/extract-skills
 * @access  Private
 */
const extractResumeSkills = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found.'
      });
    }

    // Verify ownership
    if (resume.student.toString() !== req.student.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only extract skills from your own resumes.'
      });
    }

    // Verify that readable text is available
    if (!resume.extractedText || resume.extractionStatus === 'failed') {
      return res.status(422).json({
        success: false,
        message: 'No readable text available for this resume. Text extraction previously failed or document was empty.'
      });
    }

    try {
      const skills = extractSkillsFromText(resume.extractedText);
      resume.extractedSkills = skills;
      resume.skillExtractionStatus = 'success';
      resume.skillExtractionProcessedAt = new Date();
      resume.skillExtractionError = null;
      await resume.save();

      return res.status(200).json({
        success: true,
        message: 'Skills extracted and normalized successfully.',
        count: skills.length,
        extractedSkills: skills,
        skillExtractionStatus: resume.skillExtractionStatus,
        skillExtractionProcessedAt: resume.skillExtractionProcessedAt
      });
    } catch (skillErr) {
      resume.skillExtractionStatus = 'failed';
      resume.skillExtractionError = skillErr.message;
      resume.skillExtractionProcessedAt = new Date();
      await resume.save();

      return res.status(500).json({
        success: false,
        message: `Skill extraction failed: ${skillErr.message}`
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Compare resume skills with industry requirements for selected career role
 * @route   POST /api/resume/:id/analyze-gap
 * @access  Private
 */
const analyzeResumeSkillGap = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found.'
      });
    }

    // 1. Verify ownership (strictly authenticated student's own resume)
    if (resume.student.toString() !== req.student.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only analyze your own resumes.'
      });
    }

    // 2. Verify resume text extraction succeeded
    if (!resume.extractedText || resume.extractionStatus !== 'success') {
      return res.status(422).json({
        success: false,
        message: 'Resume text extraction is not complete or previously failed. Text is required for gap analysis.'
      });
    }

    // 3. Verify skill extraction succeeded
    if (resume.skillExtractionStatus !== 'success' || !Array.isArray(resume.extractedSkills)) {
      return res.status(400).json({
        success: false,
        message: 'Resume skills have not been extracted yet. Please run skill extraction on this resume first.'
      });
    }

    // 4. Obtain target career role
    const targetRole = (req.body?.targetRole || resume.targetRole || '').trim();
    if (!targetRole) {
      return res.status(400).json({
        success: false,
        message: 'Target career role is missing. Please set a target career role for gap analysis.'
      });
    }

    // 5. Look up IndustryRoleProfile by slug or exact name
    const roleSlug = IndustryRoleProfile.slugifyRole(targetRole);
    const escapedRole = targetRole.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const industryProfile = await IndustryRoleProfile.findOne({
      $or: [
        { roleSlug },
        { role: new RegExp(`^${escapedRole}$`, 'i') }
      ]
    }).lean();

    if (!industryProfile) {
      return res.status(404).json({
        success: false,
        message: `Industry profile for role '${targetRole}' is not available in our dataset. Available roles can be browsed in Career Explorer.`
      });
    }

    // 6. Perform skill-gap comparison
    const comparison = compareSkillsWithIndustry(
      resume.extractedSkills,
      industryProfile.skills || [],
      industryProfile.totalPostings || 0
    );

    // 7. Store latest analysis in the resume document
    resume.skillGapAnalysis = {
      role: industryProfile.role,
      roleSlug: industryProfile.roleSlug,
      totalPostings: industryProfile.totalPostings,
      datasetSource: industryProfile.datasetSource,
      matchedSkills: comparison.matchedSkills,
      missingSkills: comparison.missingSkills,
      resumeOnlySkills: comparison.resumeOnlySkills,
      summary: comparison.summary,
      advisoryDisclaimer: comparison.advisoryDisclaimer,
      analyzedAt: new Date()
    };

    // If targetRole was updated, also update targetRole field
    if (targetRole !== resume.targetRole) {
      resume.targetRole = industryProfile.role;
    }

    await resume.save();

    return res.status(200).json({
      success: true,
      message: 'Resume skill gap analysis completed successfully.',
      analysis: resume.skillGapAnalysis
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate AI-powered rewrite suggestions for student resume
 * @route   POST /api/resume/:id/rewrite
 * @access  Private
 */
const rewriteResumeContent = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found.'
      });
    }

    // 1. Verify ownership (strictly authenticated student's own resume)
    if (resume.student.toString() !== req.student.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only rewrite your own resumes.'
      });
    }

    // 2. Verify resume text extraction succeeded
    if (!resume.extractedText || resume.extractionStatus !== 'success') {
      return res.status(422).json({
        success: false,
        message: 'Resume text extraction is not complete or previously failed. Text is required for AI rewriting.'
      });
    }

    // 3. Obtain target career role
    const targetRole = (req.body?.targetRole || resume.targetRole || '').trim();
    if (!targetRole) {
      return res.status(400).json({
        success: false,
        message: 'Target career role is missing. Please specify a target career role for the rewrite.'
      });
    }

    // 4. Retrieve existing skill-gap metrics if available
    const matchedSkills = resume.skillGapAnalysis?.matchedSkills || [];
    const missingSkills = resume.skillGapAnalysis?.missingSkills || [];
    const extractedSkills = resume.extractedSkills || [];

    // 5. Generate structured rewrite using Gemini AI
    try {
      const rewriteResult = await generateResumeRewrite({
        resumeText: resume.extractedText,
        targetRole,
        extractedSkills,
        matchedSkills,
        missingSkills
      });

      // 6. Save latest rewrite result in Resume document (without overwriting extractedText)
      resume.rewriteResult = rewriteResult;
      if (targetRole !== resume.targetRole) {
        resume.targetRole = targetRole;
      }
      await resume.save();

      return res.status(200).json({
        success: true,
        message: 'Resume rewrite generated successfully using Google Gemini AI.',
        rewriteResult: resume.rewriteResult
      });
    } catch (aiError) {
      const statusCode = aiError.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: aiError.message || 'AI resume rewriting failed.',
        code: aiError.code || 'AI_ERROR'
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadResume,
  getMyResumes,
  getResumeById,
  deleteResume,
  extractResumeSkills,
  analyzeResumeSkillGap,
  rewriteResumeContent
};
