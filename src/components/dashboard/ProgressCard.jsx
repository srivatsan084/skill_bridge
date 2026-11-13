import React from 'react';
import { Award, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';

export default function ProgressCard({ student, readiness = 62 }) {
  const percentage = readiness || 62;
  const acquiredCount = student?.skills?.length || 0;

  return (
    <Card
      title="Role Readiness Progress"
      subtitle={`Estimated alignment with ${student?.targetRole || 'Target Role'}`}
      action={<Badge variant={percentage >= 70 ? 'emerald' : 'blue'}>Dynamic Estimate</Badge>}
    >
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Readiness Circular Score */}
        <div className="relative flex items-center justify-center shrink-0">
          <div className="w-24 h-24 rounded-full border-8 border-slate-100 flex items-center justify-center relative">
            <svg className="w-24 h-24 -rotate-90 absolute top-[-8px] left-[-8px]">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                className="text-emerald-500"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - percentage / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="text-center">
              <span className="text-2xl font-black text-slate-900">{percentage}%</span>
              <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Matched</span>
            </div>
          </div>
        </div>

        {/* Breakdown details */}
        <div className="flex-1 space-y-2.5 text-xs w-full">
          <div>
            <div className="flex justify-between font-medium text-slate-600 mb-1">
              <span>Overall Skill Benchmark Target</span>
              <span className="font-semibold text-slate-800">80% Target for Internships</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-brand-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{acquiredCount} Skills In Profile</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Self-Assessed Levels</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[11px] text-slate-500 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-brand-500 shrink-0" />
        <span>Calculated dynamically from your saved skills and self-assessments vs industry benchmarks.</span>
      </div>
    </Card>
  );
}
