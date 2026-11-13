import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Compass,
  LayoutDashboard,
  Briefcase,
  GitCompare,
  Milestone,
  BookOpen,
  User,
  ArrowLeft,
  GraduationCap,
  LogOut,
  LogIn
} from 'lucide-react';
import { useStudent } from '../../context/StudentContext';

export default function Sidebar({ isOpen, onClose }) {
  const { student, currentReadiness, isAuthenticated, logout } = useStudent();

  const navItems = [
    { label: 'Dashboard', path: '/app', icon: LayoutDashboard, exact: true },
    { label: 'Career Explorer', path: '/app/careers', icon: Briefcase },
    { label: 'Skill Gap Analysis', path: '/app/skill-gap', icon: GitCompare },
    { label: 'My Roadmap', path: '/app/roadmap', icon: Milestone },
    { label: 'Learning Resources', path: '/app/resources', icon: BookOpen },
    { label: 'My Profile', path: '/app/profile', icon: User },
  ];

  const targetRole = student?.targetRole || 'Full Stack Developer';
  const readiness = currentReadiness || 62;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar aside */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-sm">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-white">SkillBridge</span>
              <span className="text-[10px] uppercase font-semibold text-brand-300 tracking-wider">
                Student Portal
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* Navigation items */}
        <div className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Student Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Academic status summary badge */}
        <div className="p-4 mx-3 mb-4 rounded-xl bg-slate-800/80 border border-slate-700/60">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-300">
            <GraduationCap className="w-4 h-4" />
            <span>Target Goal</span>
          </div>
          <p className="mt-1 text-xs text-slate-200 font-medium truncate">{targetRole}</p>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
            <span>Readiness</span>
            <span className="font-semibold text-emerald-400">{readiness}%</span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${readiness}%` }} />
          </div>
        </div>

        {/* Return to public site & Logout footer */}
        <div className="p-3 border-t border-slate-800 space-y-1">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={async () => {
                await logout();
                window.location.href = '/login';
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-lg transition-colors text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out (Clear Session)</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In with Real Account</span>
            </Link>
          )}

          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit to Public Website</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
