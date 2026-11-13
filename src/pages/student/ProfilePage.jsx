import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  GraduationCap,
  Building2,
  Mail,
  Calendar,
  Target,
  CheckCircle2,
  Trash2,
  Plus,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  Clock,
  Layers,
  BookOpen,
  Check
} from 'lucide-react';
import { useStudent } from '../../context/StudentContext';
import {
  ACADEMIC_YEARS,
  CAREER_GOALS_LIST,
  PREDEFINED_SKILLS,
  LEARNING_FORMAT_OPTIONS,
  LEARNING_HOURS_OPTIONS,
  LEARNING_LANGUAGES
} from '../../data/onboardingData';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { student, updateProfile, resetToDemo, startFreshOnboarding } = useStudent();

  // Local form state initialized from student context
  const [formData, setFormData] = useState({
    name: student?.name || '',
    email: student?.email || '',
    college: student?.college || '',
    degree: student?.degree || 'B.Tech',
    branch: student?.branch || '',
    academicYear: student?.academicYear || 'Second Year',
    semester: student?.semester || 'Semester 4',
    graduationYear: student?.graduationYear || 2026,
    targetRole: student?.targetRole || 'Full Stack Developer',
    secondaryInterests: student?.secondaryInterests || [],
    skills: student?.skills ? [...student.skills] : [],
    learningPreferences: {
      formats: student?.learningPreferences?.formats || ['Video', 'Documentation'],
      hoursPerWeek: student?.learningPreferences?.hoursPerWeek || '5-10 hours / week (Recommended for college students)',
      language: student?.learningPreferences?.language || 'English',
      preferFreeOnly: student?.learningPreferences?.preferFreeOnly ?? true
    },
    bio: student?.bio || ''
  });

  // Re-sync if context updates from outside
  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        email: student.email || '',
        college: student.college || '',
        degree: student.degree || 'B.Tech',
        branch: student.branch || '',
        academicYear: student.academicYear || 'Second Year',
        semester: student.semester || 'Semester 4',
        graduationYear: student.graduationYear || 2026,
        targetRole: student.targetRole || 'Full Stack Developer',
        secondaryInterests: student.secondaryInterests || [],
        skills: student.skills ? [...student.skills] : [],
        learningPreferences: {
          formats: student.learningPreferences?.formats || ['Video', 'Documentation'],
          hoursPerWeek: student.learningPreferences?.hoursPerWeek || '5-10 hours / week (Recommended for college students)',
          language: student.learningPreferences?.language || 'English',
          preferFreeOnly: student.learningPreferences?.preferFreeOnly ?? true
        },
        bio: student.bio || ''
      });
    }
  }, [student]);

  const [activeTab, setActiveTab] = useState('basic');
  const [saveToast, setSaveToast] = useState(false);
  const [customSkillName, setCustomSkillName] = useState('');
  const [customSkillCategory, setCustomSkillCategory] = useState('Programming');
  const [customSkillError, setCustomSkillError] = useState('');

  // Synchronize semester options when academic year changes
  const handleAcademicYearChange = (year) => {
    const yearObj = ACADEMIC_YEARS.find((y) => y.id === year);
    const validSemesters = yearObj ? yearObj.semesters : ['Semester 1', 'Semester 2'];
    const semValid = validSemesters.includes(formData.semester);

    setFormData((prev) => ({
      ...prev,
      academicYear: year,
      semester: semValid ? prev.semester : validSemesters[0]
    }));
  };

  const availableSemesters =
    ACADEMIC_YEARS.find((y) => y.id === formData.academicYear)?.semesters || [
      'Semester 1',
      'Semester 2'
    ];

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Save changes to context and MongoDB
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      await updateProfile(formData);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3500);
    } catch (err) {
      setSaveError(err.message || 'Failed to save changes to MongoDB.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle secondary career interest
  const toggleSecondaryInterest = (roleTitle) => {
    if (roleTitle === formData.targetRole) return;
    setFormData((prev) => {
      const exists = prev.secondaryInterests.includes(roleTitle);
      return {
        ...prev,
        secondaryInterests: exists
          ? prev.secondaryInterests.filter((r) => r !== roleTitle)
          : [...prev.secondaryInterests, roleTitle]
      };
    });
  };

  // Skill management
  const handleAddPredefinedSkill = (skillName, category) => {
    if (formData.skills.some((s) => s.name.toLowerCase() === skillName.toLowerCase())) return;
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, { name: skillName, category, level: 'Beginner' }]
    }));
  };

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    const trimmed = customSkillName.trim();
    if (!trimmed) return;
    if (formData.skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setCustomSkillError('Skill already exists in your inventory');
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
  };

  const handleRemoveSkill = (skillName) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s.name !== skillName)
    }));
  };

  const handleSkillLevelChange = (skillName, newLevel) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.map((s) => (s.name === skillName ? { ...s, level: newLevel } : s))
    }));
  };

  // Toggle learning format
  const toggleLearningFormat = (fmt) => {
    setFormData((prev) => {
      const current = prev.learningPreferences.formats;
      const next = current.includes(fmt)
        ? current.filter((f) => f !== fmt)
        : [...current, fmt];
      return {
        ...prev,
        learningPreferences: { ...prev.learningPreferences, formats: next }
      };
    });
  };

  const handleRestartOnboarding = () => {
    if (window.confirm('Restart the 5-step onboarding wizard? You will be guided through all configuration steps.')) {
      startFreshOnboarding();
      navigate('/onboarding');
    }
  };

  const handleResetDemo = () => {
    if (window.confirm('Reset profile to default sample engineering student (Aarav Sharma)?')) {
      resetToDemo();
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-navy text-white flex items-center justify-center font-bold text-2xl shadow-sm">
            {formData.name ? formData.name.split(' ').map((n) => n[0]).join('') : 'SB'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">{formData.name || 'Student Profile'}</h2>
              <Badge variant="blue">{formData.academicYear}</Badge>
              {student?.isDemoAccount ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  Demo Account
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  MongoDB Synced
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {formData.email} • ID: {student?.id || 'std-2024'}
            </p>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              {formData.degree} in {formData.branch} • {formData.semester}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            onClick={handleSave}
            variant="primary"
            size="sm"
            icon={Save}
          >
            Save All Changes
          </Button>
          <button
            type="button"
            onClick={handleResetDemo}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors text-xs font-medium flex items-center gap-1 border border-slate-200"
            title="Reset to sample student"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Save Success Toast */}
      {saveToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Profile Updated Successfully!</strong> All changes have been synchronized with your Dashboard, Skill Gap analysis, and Roadmap.
          </span>
        </div>
      )}

      {/* Tab Controls */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-xs gap-2 sm:gap-6 overflow-x-auto">
        {[
          { id: 'basic', label: '1. Basic & Academic' },
          { id: 'careers', label: '2. Career Interests' },
          { id: 'skills', label: `3. Technical Skills (${formData.skills.length})` },
          { id: 'preferences', label: '4. Learning Preferences' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-2 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: BASIC INFORMATION */}
      {activeTab === 'basic' && (
        <Card title="Academic and Personal Details" subtitle="Edit your college, academic year, and semester">
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">College Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">College / University Name</label>
              <input
                type="text"
                required
                value={formData.college}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Degree / Course</label>
                <input
                  type="text"
                  required
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Branch / Department</label>
                <input
                  type="text"
                  required
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Academic Year</label>
                <select
                  value={formData.academicYear}
                  onChange={(e) => handleAcademicYearChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  {ACADEMIC_YEARS.map((y) => (
                    <option key={y.id} value={y.id}>{y.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Semester</label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  {availableSemesters.map((sem) => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expected Graduation Year</label>
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

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Student Bio / Learning Motivation</label>
              <textarea
                rows={2}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
            </div>

            <div className="pt-3 flex justify-end">
              <Button type="submit" variant="primary" size="sm" icon={Save}>
                Save Basic Info
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 2: CAREER INTERESTS */}
      {activeTab === 'careers' && (
        <Card title="Career Track Configuration" subtitle="Select your primary career goal and secondary interests">
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <div>
                Click a role to set it as your <strong>Primary Career Goal</strong>. Check or uncheck secondary roles to explore additional tracks.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                        secondaryInterests: prev.secondaryInterests.filter((r) => r !== role.title)
                      }));
                    }}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isPrimary
                        ? 'bg-blue-50/70 border-brand-500 ring-2 ring-brand-500/20'
                        : isSecondary
                        ? 'bg-purple-50/50 border-purple-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">{role.title}</h4>
                      {isPrimary && <Badge variant="blue" size="xs">Primary Goal</Badge>}
                      {isSecondary && <Badge variant="purple" size="xs">Secondary</Badge>}
                    </div>

                    <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                      {role.description}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">
                        {isPrimary ? 'Current Active Target' : 'Click to make primary'}
                      </span>
                      {!isPrimary && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSecondaryInterest(role.title);
                          }}
                          className={`px-2 py-0.5 rounded font-medium ${
                            isSecondary
                              ? 'bg-purple-100 text-purple-700'
                              : 'text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {isSecondary ? '✓ In Secondary' : '+ Add Secondary'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 flex justify-end">
              <Button type="button" onClick={handleSave} variant="primary" size="sm" icon={Save}>
                Save Career Goals
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 3: TECHNICAL SKILLS */}
      {activeTab === 'skills' && (
        <Card title="Skill Inventory Management" subtitle="Add or remove skills and adjust your self-assessed levels">
          <div className="space-y-6">
            {/* Custom Skill Input */}
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
                  placeholder="e.g. Docker, TypeScript, GraphQL, Django..."
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

            {/* Quick add from predefined categories */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Quick-Add From Standard Categories
              </span>
              <div className="space-y-2.5">
                {Object.entries(PREDEFINED_SKILLS).map(([cat, skillsList]) => (
                  <div key={cat} className="p-2.5 bg-white border border-slate-100 rounded-lg space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">{cat}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {skillsList.map((skillName) => {
                        const isAdded = formData.skills.some(
                          (s) => s.name.toLowerCase() === skillName.toLowerCase()
                        );
                        return (
                          <button
                            key={skillName}
                            type="button"
                            onClick={() => handleAddPredefinedSkill(skillName, cat)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                              isAdded
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                : 'bg-slate-100 text-slate-700 hover:bg-brand-50 hover:text-brand-700'
                            }`}
                          >
                            {isAdded ? <Check className="w-3 h-3 text-emerald-600" /> : <Plus className="w-3 h-3 text-slate-400" />}
                            <span>{skillName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Existing Skills List */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  Your Current Skills ({formData.skills.length})
                </h4>
                <span className="text-[11px] text-slate-400">
                  Self-assessed level selector
                </span>
              </div>

              {formData.skills.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No skills selected.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
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

            <div className="pt-3 flex justify-end">
              <Button type="button" onClick={handleSave} variant="primary" size="sm" icon={Save}>
                Save Skills
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 4: LEARNING PREFERENCES */}
      {activeTab === 'preferences' && (
        <Card title="Learning Preferences & Schedule" subtitle="Adjust your weekly time commitment and resource format filters">
          <div className="space-y-6 text-xs">
            {/* Preferred Formats */}
            <div>
              <label className="block font-bold text-slate-800 text-xs sm:text-sm mb-2">
                Preferred Learning Formats
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {LEARNING_FORMAT_OPTIONS.map((opt) => {
                  const isSelected = formData.learningPreferences.formats.includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      onClick={() => toggleLearningFormat(opt.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
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
                Weekly Time Commitment
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

            {/* Language & Free toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block font-bold text-slate-800 text-xs sm:text-sm mb-1">
                  Preferred Language
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
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 text-xs sm:text-sm mb-1">
                  100% Free Materials Policy
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
                      Recommend Free Resources Only
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Exclude paid courses & bootcamps
                    </span>
                  </div>
                  <div
                    className={`w-10 h-6 flex items-center rounded-full p-1 duration-300 ${
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

            <div className="pt-3 flex justify-between items-center">
              <button
                type="button"
                onClick={handleRestartOnboarding}
                className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Launch Guided Onboarding Wizard</span>
              </button>
              <Button type="button" onClick={handleSave} variant="primary" size="sm" icon={Save}>
                Save Preferences
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
