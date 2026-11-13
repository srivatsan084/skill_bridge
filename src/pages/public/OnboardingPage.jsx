import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Search,
  BookOpen,
  Target,
  Sparkles,
  Info,
  Clock,
  Globe,
  Award,
  Layers,
  Check,
  ShieldCheck
} from 'lucide-react';
import { useStudent } from '../../context/StudentContext';
import {
  ACADEMIC_YEARS,
  CAREER_GOALS_LIST,
  PREDEFINED_SKILLS,
  PROFICIENCY_LEVELS,
  LEARNING_FORMAT_OPTIONS,
  LEARNING_HOURS_OPTIONS,
  LEARNING_LANGUAGES
} from '../../data/onboardingData';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { student, completeOnboarding } = useStudent();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Onboarding Form State
  const [formData, setFormData] = useState({
    // Step 1: Basic info
    name: student?.name || '',
    email: student?.email || '',
    college: student?.college || '',
    degree: student?.degree || 'B.Tech',
    branch: student?.branch || 'Computer Science & Engineering',
    academicYear: student?.academicYear || 'Second Year',
    semester: student?.semester || 'Semester 4',
    graduationYear: student?.graduationYear || new Date().getFullYear() + 2,

    // Step 2: Career interests
    targetRole: student?.targetRole || 'Full Stack Developer',
    secondaryInterests: student?.secondaryInterests || [],

    // Step 3: Existing skills
    skills: student?.skills?.length
      ? [...student.skills]
      : [
          { name: 'C', category: 'Programming', level: 'Intermediate' },
          { name: 'HTML', category: 'Frontend', level: 'Intermediate' },
          { name: 'CSS', category: 'Frontend', level: 'Beginner' },
          { name: 'Git', category: 'Other', level: 'Beginner' }
        ],

    // Step 4: Learning preferences
    learningPreferences: {
      formats: student?.learningPreferences?.formats || ['Video', 'Interactive'],
      hoursPerWeek: student?.learningPreferences?.hoursPerWeek || '5-10 hours / week (Recommended for college students)',
      language: student?.learningPreferences?.language || 'English',
      preferFreeOnly: student?.learningPreferences?.preferFreeOnly ?? true
    },

    bio: student?.bio || ''
  });

  // Errors for step validation
  const [errors, setErrors] = useState({});

  // Skill search & custom skill input states
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [customSkillName, setCustomSkillName] = useState('');
  const [customSkillCategory, setCustomSkillCategory] = useState('Programming');
  const [customSkillError, setCustomSkillError] = useState('');

  // Handle dynamic semester updates when academic year changes
  const handleAcademicYearChange = (year) => {
    const yearObj = ACADEMIC_YEARS.find((y) => y.id === year);
    const validSemesters = yearObj ? yearObj.semesters : ['Semester 1', 'Semester 2'];
    const currentSemValid = validSemesters.includes(formData.semester);

    setFormData((prev) => ({
      ...prev,
      academicYear: year,
      semester: currentSemValid ? prev.semester : validSemesters[0]
    }));
  };

  // Get current semesters for selected academic year
  const currentAvailableSemesters =
    ACADEMIC_YEARS.find((y) => y.id === formData.academicYear)?.semesters || [
      'Semester 1',
      'Semester 2'
    ];

  // Validation functions
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Full name is required';
      if (!formData.college.trim()) newErrors.college = 'College or University name is required';
      if (!formData.degree.trim()) newErrors.degree = 'Degree / course is required';
      if (!formData.branch.trim()) newErrors.branch = 'Branch / department is required';
      if (!formData.graduationYear) newErrors.graduationYear = 'Expected graduation year is required';
    }

    if (step === 2) {
      if (!formData.targetRole) newErrors.targetRole = 'Please choose a primary career goal';
    }

    if (step === 3) {
      if (!formData.skills || formData.skills.length === 0) {
        newErrors.skills = 'Please add at least 1 skill you have learned or practiced';
      }
    }

    if (step === 4) {
      if (!formData.learningPreferences.formats.length) {
        newErrors.formats = 'Please select at least one preferred learning format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Step 2: Toggle secondary career interest
  const toggleSecondaryInterest = (roleTitle) => {
    if (roleTitle === formData.targetRole) return; // cannot be both primary and secondary
    setFormData((prev) => {
      const exists = prev.secondaryInterests.includes(roleTitle);
      const updated = exists
        ? prev.secondaryInterests.filter((r) => r !== roleTitle)
        : [...prev.secondaryInterests, roleTitle];
      return { ...prev, secondaryInterests: updated };
    });
  };

  // Step 3: Add skill from predefined list
  const handleAddPredefinedSkill = (skillName, category) => {
    if (formData.skills.some((s) => s.name.toLowerCase() === skillName.toLowerCase())) {
      return; // Already added
    }
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, { name: skillName, category, level: 'Beginner' }]
    }));
    setErrors((prev) => ({ ...prev, skills: null }));
  };

  // Step 3: Add custom skill
  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    const trimmed = customSkillName.trim();
    if (!trimmed) {
      setCustomSkillError('Enter a skill name');
      return;
    }
    if (formData.skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setCustomSkillError('This skill is already in your list');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      skills: [
        ...prev.skills,
        { name: trimmed, category: customSkillCategory, level: 'Beginner', isCustom: true }
      ]
    }));
    setCustomSkillName('');
    setCustomSkillError('');
    setErrors((prev) => ({ ...prev, skills: null }));
  };

  // Step 3: Remove skill
  const handleRemoveSkill = (skillName) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s.name !== skillName)
    }));
  };

  // Step 3: Change self-assessed level
  const handleSkillLevelChange = (skillName, newLevel) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.map((s) => (s.name === skillName ? { ...s, level: newLevel } : s))
    }));
  };

  // Step 4: Toggle learning format
  const toggleLearningFormat = (formatId) => {
    setFormData((prev) => {
      const current = prev.learningPreferences.formats;
      const next = current.includes(formatId)
        ? current.filter((f) => f !== formatId)
        : [...current, formatId];
      return {
        ...prev,
        learningPreferences: { ...prev.learningPreferences, formats: next }
      };
    });
    setErrors((prev) => ({ ...prev, formats: null }));
  };

  // Step 5: Final Submission
  const [submitting, setSubmitting] = useState(false);
  const handleComplete = async () => {
    if (validateStep(1) && validateStep(2) && validateStep(3) && validateStep(4)) {
      setSubmitting(true);
      try {
        await completeOnboarding(formData);
        navigate('/app');
      } catch (err) {
        console.error('Failed to complete onboarding on backend:', err);
        // Even if offline, navigate to app
        navigate('/app');
      } finally {
        setSubmitting(false);
      }
    } else {
      alert('Please check all previous steps for missing information before submitting.');
    }
  };

  const stepLabels = [
    'Basic Information',
    'Career Interests',
    'Technical Skills',
    'Learning Preferences',
    'Review & Confirm'
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header / Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>Student Onboarding Wizard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Build Your Personalised Learning Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            This information guides your semester-wise learning roadmap, skill-gap analysis, and free resource recommendations.
          </p>
        </div>

        {/* Progress Bar & Step Tabs */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Step {currentStep} of {totalSteps}: <strong className="text-brand-900">{stepLabels[currentStep - 1]}</strong></span>
            <span>{Math.round((currentStep / totalSteps) * 100)}% Completed</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-6">
            <div
              className="bg-brand-500 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>

          {/* Step Pill Indicators */}
          <div className="grid grid-cols-5 gap-1 sm:gap-2">
            {stepLabels.map((label, idx) => {
              const stepNum = idx + 1;
              const isPassed = stepNum < currentStep;
              const isCurrent = stepNum === currentStep;

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    if (isPassed) setCurrentStep(stepNum);
                  }}
                  disabled={!isPassed && !isCurrent}
                  className={`text-left p-2 rounded-lg text-[11px] sm:text-xs transition-colors flex items-center gap-1.5 ${
                    isCurrent
                      ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200'
                      : isPassed
                      ? 'text-slate-700 hover:bg-slate-50 cursor-pointer font-medium'
                      : 'text-slate-400 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                      isPassed
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isPassed ? <Check className="w-3 h-3" /> : stepNum}
                  </span>
                  <span className="hidden md:inline truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 1: BASIC INFORMATION */}
        {currentStep === 1 && (
          <Card
            title="Step 1: Basic & Academic Information"
            subtitle="Tell us about your university, degree, and current academic stage"
          >
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Aarav Sharma"
                    className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      errors.name ? 'border-red-400 bg-red-50/30' : 'border-slate-300 bg-white'
                    }`}
                  />
                  {errors.name && <p className="text-red-500 text-[11px] mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    College Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="student@college.edu"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  College / University Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  placeholder="e.g. National Institute of Technology"
                  className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    errors.college ? 'border-red-400 bg-red-50/30' : 'border-slate-300 bg-white'
                  }`}
                />
                {errors.college && <p className="text-red-500 text-[11px] mt-1">{errors.college}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Degree / Course <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.degree}
                    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="B.Tech">B.Tech (Bachelor of Technology)</option>
                    <option value="B.E.">B.E. (Bachelor of Engineering)</option>
                    <option value="BCA">BCA (Bachelor of Computer Applications)</option>
                    <option value="MCA">MCA (Master of Computer Applications)</option>
                    <option value="B.Sc Computer Science">B.Sc Computer Science / IT</option>
                    <option value="Other">Other Technical Degree</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Branch / Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    placeholder="e.g. Computer Science & Engineering"
                    className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      errors.branch ? 'border-red-400 bg-red-50/30' : 'border-slate-300 bg-white'
                    }`}
                  />
                  {errors.branch && <p className="text-red-500 text-[11px] mt-1">{errors.branch}</p>}
                </div>
              </div>

              {/* Academic Year and Synchronized Semester */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Academic Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.academicYear}
                    onChange={(e) => handleAcademicYearChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-medium"
                  >
                    {ACADEMIC_YEARS.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Current Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-medium"
                  >
                    {currentAvailableSemesters.map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Auto-matched to {formData.academicYear}
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Expected Graduation Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="2024"
                    max="2032"
                    value={formData.graduationYear}
                    onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 2: CAREER INTERESTS */}
        {currentStep === 2 && (
          <Card
            title="Step 2: Career Interests & Goals"
            subtitle="Select one primary career track and optional secondary interests"
          >
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  Click a role to set it as your <strong>Primary Career Goal</strong>. Your semester roadmap and skill-gap benchmarks will be aligned with this choice. You can check secondary boxes to explore multiple options.
                </div>
              </div>

              {errors.targetRole && (
                <p className="text-red-500 text-xs font-semibold">{errors.targetRole}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {CAREER_GOALS_LIST.map((role) => {
                  const isPrimary = formData.targetRole === role.title;
                  const isSecondary = formData.secondaryInterests.includes(role.title);

                  return (
                    <div
                      key={role.id}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          targetRole: role.title,
                          // If it was in secondary, remove it
                          secondaryInterests: prev.secondaryInterests.filter((r) => r !== role.title)
                        }));
                        setErrors((prev) => ({ ...prev, targetRole: null }));
                      }}
                      className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
                        isPrimary
                          ? 'bg-blue-50/70 border-brand-500 ring-2 ring-brand-500/20 shadow-sm'
                          : isSecondary
                          ? 'bg-purple-50/50 border-purple-300'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                              isPrimary
                                ? 'bg-brand-600 text-white font-bold'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {isPrimary ? <Check className="w-3.5 h-3.5" /> : null}
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm">{role.title}</h4>
                        </div>

                        {isPrimary && <Badge variant="blue" size="xs">Primary Goal</Badge>}
                        {isSecondary && <Badge variant="purple" size="xs">Secondary</Badge>}
                      </div>

                      <p className="text-slate-600 text-xs mt-2 leading-relaxed">
                        {role.description}
                      </p>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {isPrimary ? 'Selected as primary goal' : 'Click to select as primary'}
                        </span>

                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSecondaryInterest(role.title);
                            }}
                            className={`text-[11px] font-medium px-2 py-0.5 rounded transition-colors ${
                              isSecondary
                                ? 'bg-purple-100 text-purple-700'
                                : 'text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            {isSecondary ? '✓ Added as Secondary' : '+ Add as Secondary'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* STEP 3: EXISTING TECHNICAL SKILLS */}
        {currentStep === 3 && (
          <Card
            title="Step 3: Existing Technical Skills & Self-Assessment"
            subtitle="Add what you already know from your coursework, labs, and personal study"
          >
            <div className="space-y-6">
              {/* Disclaimer notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Important Note:</strong> Skill levels are based on your <strong>honest self-assessment</strong>. They help us identify what you can comfortably build and what topics need reinforcement. They are not formal exam certifications.
                </div>
              </div>

              {errors.skills && (
                <p className="text-red-500 text-xs font-semibold">{errors.skills}</p>
              )}

              {/* Add Custom Skill Bar */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Add Any Custom Skill
                </span>
                <form onSubmit={handleAddCustomSkill} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={customSkillName}
                    onChange={(e) => {
                      setCustomSkillName(e.target.value);
                      setCustomSkillError('');
                    }}
                    placeholder="e.g. Django, Flutter, Redis, GraphQL, Linux..."
                    className="flex-1 px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  />
                  <select
                    value={customSkillCategory}
                    onChange={(e) => setCustomSkillCategory(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Programming">Programming</option>
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Database">Database</option>
                    <option value="Other">Other / Tools</option>
                  </select>
                  <Button type="submit" variant="secondary" size="sm" icon={Plus}>
                    Add Custom
                  </Button>
                </form>
                {customSkillError && (
                  <p className="text-red-500 text-[11px] mt-1">{customSkillError}</p>
                )}
              </div>

              {/* Quick Select from Categories */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Quick-Add From Standard Categories
                  </span>
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter skills..."
                      value={skillSearchQuery}
                      onChange={(e) => setSkillSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-2 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {Object.entries(PREDEFINED_SKILLS).map(([cat, skillsList]) => {
                    const filtered = skillsList.filter((s) =>
                      s.toLowerCase().includes(skillSearchQuery.toLowerCase())
                    );
                    if (!filtered.length) return null;

                    return (
                      <div key={cat} className="p-3 bg-white border border-slate-100 rounded-xl space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase">
                          {cat}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {filtered.map((skillName) => {
                            const isAdded = formData.skills.some(
                              (s) => s.name.toLowerCase() === skillName.toLowerCase()
                            );
                            return (
                              <button
                                key={skillName}
                                type="button"
                                onClick={() => handleAddPredefinedSkill(skillName, cat)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                                  isAdded
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                    : 'bg-slate-100 text-slate-700 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 border border-transparent'
                                }`}
                              >
                                {isAdded ? <Check className="w-3 h-3 text-emerald-600" /> : <Plus className="w-3 h-3 text-slate-400" />}
                                <span>{skillName}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Skills List with Self-Assessment Selector */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    Your Selected Skills ({formData.skills.length})
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Set your self-assessment level for each
                  </span>
                </div>

                {formData.skills.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                    No skills added yet. Use the quick-add buttons above or type a custom skill.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {formData.skills.map((skill) => (
                      <div
                        key={skill.name}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{skill.name}</span>
                          <span className="text-[11px] text-slate-400 px-1.5 py-0.5 bg-slate-50 rounded">
                            {skill.category}
                          </span>
                        </div>

                        {/* Level selection radio group */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                            {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => handleSkillLevelChange(skill.name, lvl)}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                                  skill.level === lvl
                                    ? lvl === 'Advanced'
                                      ? 'bg-purple-600 text-white shadow-sm'
                                      : lvl === 'Intermediate'
                                      ? 'bg-brand-600 text-white shadow-sm'
                                      : 'bg-slate-700 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {lvl}
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill.name)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label={`Remove ${skill.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* STEP 4: LEARNING PREFERENCES */}
        {currentStep === 4 && (
          <Card
            title="Step 4: Learning Preferences & Schedule"
            subtitle="Tailor how SkillBridge recommends tutorials, documentation, and pace"
          >
            <div className="space-y-6 text-xs">
              {/* Preferred Formats */}
              <div>
                <label className="block font-bold text-slate-800 text-xs sm:text-sm mb-2">
                  Preferred Learning Formats <span className="text-red-500">*</span>
                </label>
                {errors.formats && (
                  <p className="text-red-500 text-xs mb-2 font-medium">{errors.formats}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {LEARNING_FORMAT_OPTIONS.map((opt) => {
                    const isSelected = formData.learningPreferences.formats.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => toggleLearningFormat(opt.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-brand-50 border-brand-500 ring-2 ring-brand-500/10'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">{opt.label}</span>
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                              isSelected
                                ? 'bg-brand-600 border-brand-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                        <p className="text-slate-500 text-[11px] leading-relaxed mt-1">{opt.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hours per week */}
              <div>
                <label className="block font-bold text-slate-800 text-xs sm:text-sm mb-2">
                  Available Learning Hours Per Week
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {LEARNING_HOURS_OPTIONS.map((hrs) => {
                    const isSelected = formData.learningPreferences.hoursPerWeek === hrs;
                    return (
                      <div
                        key={hrs}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            learningPreferences: {
                              ...formData.learningPreferences,
                              hoursPerWeek: hrs
                            }
                          })
                        }
                        className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-colors ${
                          isSelected
                            ? 'bg-blue-50 border-brand-500 text-brand-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Clock className={`w-4 h-4 shrink-0 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                        <span className="text-xs">{hrs}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Preferred Language */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-bold text-slate-800 text-xs sm:text-sm mb-1">
                    Preferred Language for Content
                  </label>
                  <select
                    value={formData.learningPreferences.language}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        learningPreferences: {
                          ...formData.learningPreferences,
                          language: e.target.value
                        }
                      })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    {LEARNING_LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Free Resource Preference Toggle */}
                <div>
                  <label className="block font-bold text-slate-800 text-xs sm:text-sm mb-1">
                    Strictly 100% Free Resources
                  </label>
                  <div
                    onClick={() =>
                      setFormData({
                        ...formData,
                        learningPreferences: {
                          ...formData.learningPreferences,
                          preferFreeOnly: !formData.learningPreferences.preferFreeOnly
                        }
                      })
                    }
                    className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:border-slate-300"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 block text-xs">
                        Only Recommend Completely Free Resources
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Exclude paid subscriptions or paid bootcamps
                      </span>
                    </div>
                    <div
                      className={`w-10 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
                        formData.learningPreferences.preferFreeOnly ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${
                          formData.learningPreferences.preferFreeOnly ? 'translate-x-4' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Bio */}
              <div>
                <label className="block font-bold text-slate-800 text-xs sm:text-sm mb-1">
                  Personal Learning Goal / Bio (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="e.g. 2nd-year CS student aiming to build a full-stack project portfolio before summer internships..."
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>
            </div>
          </Card>
        )}

        {/* STEP 5: REVIEW AND CONFIRMATION */}
        {currentStep === 5 && (
          <Card
            title="Step 5: Review & Confirmation"
            subtitle="Verify your information before completing onboarding"
          >
            <div className="space-y-6 text-xs">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Academic Summary */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Academic Details
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-brand-600 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <p><strong>Name:</strong> {formData.name}</p>
                    <p><strong>College:</strong> {formData.college}</p>
                    <p><strong>Degree & Branch:</strong> {formData.degree} in {formData.branch}</p>
                    <p><strong>Year & Semester:</strong> {formData.academicYear} • {formData.semester}</p>
                    <p><strong>Graduation:</strong> {formData.graduationYear}</p>
                  </div>
                </div>

                {/* Career Goals Summary */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Career Interests
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-brand-600 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Primary Goal</span>
                      <span className="font-bold text-brand-700 text-sm">{formData.targetRole}</span>
                    </div>
                    {formData.secondaryInterests.length > 0 && (
                      <div>
                        <span className="text-[11px] text-slate-400 block font-medium">Secondary Interests</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {formData.secondaryInterests.map((r) => (
                            <Badge key={r} variant="purple" size="xs">{r}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Skills Summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Existing Skills ({formData.skills.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-brand-600 hover:underline font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {formData.skills.map((s) => (
                    <span
                      key={s.name}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs flex items-center gap-1.5 shadow-2xs"
                    >
                      <span className="font-semibold">{s.name}</span>
                      <Badge
                        variant={
                          s.level === 'Advanced'
                            ? 'purple'
                            : s.level === 'Intermediate'
                            ? 'blue'
                            : 'slate'
                        }
                        size="xs"
                      >
                        {s.level}
                      </Badge>
                    </span>
                  ))}
                </div>
              </div>

              {/* Learning Preferences Summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Learning Preferences
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="text-brand-600 hover:underline font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-600">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Formats:</span>
                    <span>{formData.learningPreferences.formats.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Hours / Week:</span>
                    <span>{formData.learningPreferences.hoursPerWeek}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Resource Policy:</span>
                    <span>{formData.learningPreferences.preferFreeOnly ? '100% Free Only' : 'Open to Paid'}</span>
                  </div>
                </div>
              </div>

              {/* Persistence Notice */}
              <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Local Profile Persistence:</strong> Clicking "Complete My Profile" will save your information to browser localStorage and immediately synchronize your Dashboard, Skill Gap chart, and Semester Roadmap.
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Wizard Controls (Back / Next / Complete) */}
        <div className="flex items-center justify-between pt-2">
          {currentStep > 1 ? (
            <Button
              type="button"
              onClick={handleBack}
              variant="secondary"
              size="md"
              icon={ArrowLeft}
            >
              Back
            </Button>
          ) : (
            <div />
          )}

          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={handleNext}
              variant="primary"
              size="md"
              icon={ArrowRight}
              iconPosition="right"
            >
              Continue to Step {currentStep + 1}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleComplete}
              variant="accent"
              size="lg"
              icon={CheckCircle2}
              iconPosition="right"
              className="shadow-md"
            >
              Complete My Profile
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
