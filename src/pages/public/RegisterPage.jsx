import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, UserPlus, ArrowRight, Info, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useStudent } from '../../context/StudentContext';
import { ACADEMIC_YEARS } from '../../data/onboardingData';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useStudent();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    college: '',
    academicYear: 'Second Year',
    semester: 'Semester 4',
    degree: 'B.Tech',
    branch: 'Computer Science & Engineering',
    graduationYear: 2026
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleYearChange = (year) => {
    const yearObj = ACADEMIC_YEARS.find((y) => y.id === year);
    const validSemesters = yearObj ? yearObj.semesters : ['Semester 1', 'Semester 2'];
    setFormData((prev) => ({
      ...prev,
      academicYear: year,
      semester: validSemesters.includes(prev.semester) ? prev.semester : validSemesters[0]
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        college: formData.college.trim(),
        academicYear: formData.academicYear,
        semester: formData.semester,
        degree: formData.degree,
        branch: formData.branch,
        graduationYear: Number(formData.graduationYear)
      };

      const result = await register(payload);
      if (result.success) {
        // Proceed to onboarding wizard with the authenticated student record
        navigate('/onboarding');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Duplicate email or invalid input.');
    } finally {
      setSubmitting(false);
    }
  };

  const availableSemesters =
    ACADEMIC_YEARS.find((y) => y.id === formData.academicYear)?.semesters || [
      'Semester 1',
      'Semester 2'
    ];

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-brand-navy flex items-center justify-center text-white">
              <Compass className="w-5 h-5 text-brand-300" />
            </div>
            <span className="font-bold text-xl text-slate-900">SkillBridge</span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create Student Account</h2>
          <p className="text-xs text-slate-500">
            Sign up to securely register your profile in MongoDB and launch your onboarding wizard.
          </p>
        </div>

        {/* MongoDB Connection Status */}
        <div className="p-3 bg-emerald-50/90 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium text-[11px]">
              MongoDB Database: <strong>skillbridge</strong>
            </span>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Real Persistence
          </span>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <strong>Registration Error:</strong> {errorMessage}
            </div>
          </div>
        )}

        <Card>
          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rohan Verma"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">College Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="rohan.verma@college.edu"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password (min 6 characters)</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
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
                placeholder="e.g. National Institute of Technology"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
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
                  placeholder="e.g. B.Tech / B.E."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Branch / Department</label>
                <input
                  type="text"
                  required
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Academic Year</label>
                <select
                  value={formData.academicYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  {ACADEMIC_YEARS.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Semester</label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  {availableSemesters.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Graduation Year</label>
                <input
                  type="number"
                  min="2024"
                  max="2032"
                  value={formData.graduationYear}
                  onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full justify-center"
                icon={UserPlus}
                disabled={submitting}
              >
                {submitting ? 'Creating Student Account in MongoDB...' : 'Register & Launch Onboarding'}
              </Button>
            </div>
          </form>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs text-slate-600">
            Already have a SkillBridge account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Sign in here
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
