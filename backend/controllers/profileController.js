const Student = require('../models/Student');

/**
 * @desc    Get currently logged-in student's full profile
 * @route   GET /api/profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    const student = await Student.findById(req.student.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.'
      });
    }

    res.status(200).json({
      success: true,
      student
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update student profile / complete onboarding
 * @route   PUT /api/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const student = await Student.findById(req.student.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.'
      });
    }

    // Allowed updatable fields
    const fieldsToUpdate = [
      'name',
      'college',
      'degree',
      'branch',
      'academicYear',
      'semester',
      'graduationYear',
      'targetRole',
      'secondaryInterests',
      'skills',
      'learningPreferences',
      'bio',
      'isOnboarded'
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        student[field] = req.body[field];
      }
    });

    const updatedStudent = await student.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      student: updatedStudent
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get profile completion & onboarding status
 * @route   GET /api/profile/status
 * @access  Private
 */
const getProfileStatus = async (req, res, next) => {
  try {
    const student = await Student.findById(req.student.id).select(
      'name email isOnboarded skills targetRole academicYear semester'
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found.'
      });
    }

    res.status(200).json({
      success: true,
      status: {
        id: student._id,
        name: student.name,
        isOnboarded: Boolean(student.isOnboarded),
        skillsCount: student.skills?.length || 0,
        targetRole: student.targetRole,
        academicYear: student.academicYear,
        semester: student.semester
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getProfileStatus
};
