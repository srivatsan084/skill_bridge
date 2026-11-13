import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Calendar, BookOpen, Edit3 } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';

export default function AcademicInfoCard({ student }) {
  if (!student) return null;

  const initials = student.name
    ? student.name.split(' ').map((n) => n[0]).join('').slice(0, 2)
    : 'SB';

  return (
    <Card
      title="Student Academic Profile"
      subtitle={`${student.degree || 'B.Tech'} in ${student.branch || 'Engineering'}`}
      action={
        <Link
          to="/app/profile"
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit</span>
        </Link>
      }
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
        <div className="w-14 h-14 rounded-2xl bg-brand-navy text-white flex items-center justify-center font-bold text-xl shadow-sm shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-lg font-bold text-slate-900 truncate">{student.name || 'Unnamed Student'}</h4>
            {student.isOnboarded ? (
              <Badge variant="emerald" size="xs">Onboarded</Badge>
            ) : (
              <Badge variant="amber" size="xs">Pending Onboarding</Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 truncate">
            {student.email || 'No email registered'} • ID: {student.id || 'std-demo'}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md truncate max-w-full">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{student.college || 'College not set'}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 text-xs">
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-slate-400 block font-medium">Academic Year</span>
          <span className="text-slate-800 font-semibold text-sm mt-0.5 block truncate">
            {student.academicYear || 'Not set'}
          </span>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-slate-400 block font-medium">Current Semester</span>
          <span className="text-slate-800 font-semibold text-sm mt-0.5 block truncate">
            {student.semester || 'Not set'}
          </span>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 col-span-2 sm:col-span-1">
          <span className="text-slate-400 block font-medium">Expected Graduation</span>
          <span className="text-slate-800 font-semibold text-sm mt-0.5 block truncate">
            {student.graduationYear || '2026'}
          </span>
        </div>
      </div>
    </Card>
  );
}
