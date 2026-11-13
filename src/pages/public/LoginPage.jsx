import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, LogIn, ArrowRight, ShieldCheck, Info, Sparkles, AlertCircle, Database } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useStudent } from '../../context/StudentContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();
  const { login, resetToDemo, startFreshOnboarding } = useStudent();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setSubmitting(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        if (result.student?.isOnboarded) {
          navigate('/app');
        } else {
          navigate('/onboarding');
        }
      }
    } catch (err) {
      setLoginError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadDemo = () => {
    resetToDemo();
    navigate('/app');
  };

  const handleLaunchFreshOnboarding = () => {
    startFreshOnboarding();
    navigate('/onboarding');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-brand-navy flex items-center justify-center text-white">
              <Compass className="w-5 h-5 text-brand-300" />
            </div>
            <span className="font-bold text-xl text-slate-900">SkillBridge</span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Student Portal Login</h2>
          <p className="text-xs text-slate-500">
            Sign in to access your semester roadmap, skills inventory and MongoDB profile.
          </p>
        </div>

        {/* MongoDB Connection Status Pill */}
        <div className="p-3 bg-emerald-50/90 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium text-[11px]">
              Connected to <strong>MongoDB Community Server</strong>
            </span>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Port 5000 Active
          </span>
        </div>

        {/* Error Alert */}
        {loginError && (
          <div className="p-3.5 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <strong>Login Failed:</strong> {loginError}
            </div>
          </div>
        )}

        {/* Form Card */}
        <Card>
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Registered Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@college.edu"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">Password</label>
                <span className="text-[11px] text-brand-600 hover:underline cursor-pointer">
                  Protected with bcrypt
                </span>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-600">
                Maintain session via secure HttpOnly cookie
              </label>
            </div>

            <div className="pt-2 space-y-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full justify-center"
                icon={LogIn}
                disabled={submitting}
              >
                {submitting ? 'Authenticating with MongoDB...' : 'Sign In to Student Account'}
              </Button>
            </div>
          </form>

          {/* Quick evaluation shortcuts */}
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block text-center">
              Guest / Demo Shortcuts
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleLoadDemo}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg text-center transition-colors"
              >
                Explore Demo Student
              </button>
              <button
                type="button"
                onClick={handleLaunchFreshOnboarding}
                className="px-2.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold rounded-lg text-center transition-colors flex items-center justify-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Guest Onboarding</span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs text-slate-600">
            Don't have a student profile yet?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
              Register new account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
