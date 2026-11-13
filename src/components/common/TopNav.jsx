import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Bell, User, CheckCircle2, Info, ChevronDown, Sparkles } from 'lucide-react';
import { useStudent } from '../../context/StudentContext';

export default function TopNav({ onOpenSidebar }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const { student, isAuthenticated } = useStudent();

  const getPageTitle = (path) => {
    if (path === '/app') return 'Student Dashboard';
    if (path.includes('careers')) return 'Career Explorer';
    if (path.includes('skill-gap')) return 'Skill Gap Analysis';
    if (path.includes('roadmap')) return 'Semester Learning Roadmap';
    if (path.includes('resources')) return 'Curated Learning Resources';
    if (path.includes('profile')) return 'Student Profile';
    return 'Student Portal';
  };

  const studentName = student?.name || 'Student';
  const studentInitials = studentName.split(' ').map((n) => n[0]).join('').slice(0, 2);

  const sampleNotifications = [
    {
      id: 1,
      title: 'Target Track Active',
      desc: `Goal set to ${student?.targetRole || 'Full Stack Developer'}`,
      time: 'Just now'
    },
    {
      id: 2,
      title: 'Semester Roadmap Synced',
      desc: `Pacing aligned with ${student?.academicYear || 'Current Year'} • ${student?.semester || 'Current Semester'}`,
      time: '1 hr ago'
    }
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Mobile hamburger & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-slate-900 leading-tight">
              {getPageTitle(location.pathname)}
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              {student?.degree || 'B.Tech'} in {student?.branch || 'Engineering'} • {student?.academicYear || 'Student'}
            </p>
          </div>
        </div>

        {/* Right: Demo Pill + Notifications + Profile Avatar */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Real Backend / Persistence tag */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-colors">
            {isAuthenticated ? (
              <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>MongoDB Active</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Demo Student Mode</span>
              </span>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative focus:outline-none"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-white" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-fadeIn">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Notifications</span>
                  <span className="text-[10px] text-brand-600 font-medium">2 updates</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {sampleNotifications.map((n) => (
                    <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors">
                      <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{n.desc}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile pill */}
          <Link
            to="/app/profile"
            className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
          >
            <div className="w-8 h-8 rounded-full bg-brand-navy text-white flex items-center justify-center font-semibold text-xs ring-2 ring-brand-100">
              {studentInitials}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-none">
                {studentName}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                {student?.semester || 'Semester'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </Link>
        </div>
      </div>
    </header>
  );
}
