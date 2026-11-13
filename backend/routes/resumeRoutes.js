const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  uploadResume,
  getMyResumes,
  getResumeById,
  deleteResume,
  extractResumeSkills,
  analyzeResumeSkillGap,
  rewriteResumeContent
} = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');

// Ensure uploads folder exists on disk
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Use memoryStorage for robust in-memory processing before disk write
const storage = multer.memoryStorage();

// File filter: accept only PDF and DOCX
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];

  if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF (.pdf) and Word (.docx) files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB maximum
  }
});

router.use(protect); // All resume routes require authentication

router.post('/upload', upload.single('resume'), uploadResume);
router.post('/:id/extract-skills', extractResumeSkills);
router.post('/:id/analyze-gap', analyzeResumeSkillGap);
router.post('/:id/rewrite', rewriteResumeContent);
router.get('/', getMyResumes);
router.get('/:id', getResumeById);
router.delete('/:id', deleteResume);

module.exports = router;
