const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    default: 'Other',
    trim: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  }
}, { _id: false });

const learningPreferencesSchema = new mongoose.Schema({
  formats: {
    type: [String],
    default: ['Video', 'Interactive']
  },
  hoursPerWeek: {
    type: String,
    default: '5-10 hours / week (Recommended for college students)'
  },
  language: {
    type: String,
    default: 'English'
  },
  preferFreeOnly: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide student name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide email address'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  college: {
    type: String,
    default: '',
    trim: true
  },
  degree: {
    type: String,
    default: 'B.Tech',
    trim: true
  },
  branch: {
    type: String,
    default: '',
    trim: true
  },
  academicYear: {
    type: String,
    enum: ['First Year', 'Second Year', 'Third Year', 'Fourth Year'],
    default: 'First Year'
  },
  semester: {
    type: String,
    default: 'Semester 1',
    trim: true
  },
  graduationYear: {
    type: Number,
    default: () => new Date().getFullYear() + 4
  },
  targetRole: {
    type: String,
    default: 'Full Stack Developer',
    trim: true
  },
  secondaryInterests: {
    type: [String],
    default: []
  },
  skills: {
    type: [skillSchema],
    default: []
  },
  learningPreferences: {
    type: learningPreferencesSchema,
    default: () => ({})
  },
  bio: {
    type: String,
    default: '',
    trim: true
  },
  isOnboarded: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Hash password before saving
studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
studentSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to remove sensitive fields when converting to JSON
studentSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('Student', studentSchema);
