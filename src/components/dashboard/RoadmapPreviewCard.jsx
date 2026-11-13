import React from 'react';
import { Link } from 'react-router-dom';
import { Milestone, CheckCircle2, Clock, Circle, ArrowRight } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';

export default function RoadmapPreviewCard({ semesters = [] }) {
  // Current semester is semester 4
  const currentSemester = semesters.find(s => s.status === 'in-progress') || semesters[1];

  return (
    <Card
      title="Roadmap Progress"
      subtitle={currentSemester ? `${currentSemester.semester} • ${currentSemester.title}` : 'Semester Plan'}
      action={
        <Link
          to="/app/roadmap"
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
        >
          Full Timeline <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      }
    >
      <div className="space-y-3">
        {currentSemester?.milestones.map((milestone, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
              milestone.done
                ? 'bg-emerald-50/40 border-emerald-100 text-slate-800'
                : milestone.active
                ? 'bg-blue-50/60 border-blue-200 text-slate-900 ring-1 ring-blue-300/50'
                : 'bg-slate-50 border-slate-100 text-slate-600'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {milestone.done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : milestone.active ? (
                <Clock className="w-4 h-4 text-brand-600 animate-pulse shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-300 shrink-0" />
              )}
              <span className={`font-medium ${milestone.active ? 'font-semibold text-brand-900' : ''}`}>
                {milestone.name}
              </span>
            </div>

            <div>
              {milestone.done && <Badge variant="emerald" size="xs">Completed</Badge>}
              {milestone.active && <Badge variant="blue" size="xs">Active Milestone</Badge>}
              {!milestone.done && !milestone.active && <Badge variant="slate" size="xs">Upcoming</Badge>}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Semester focus: {currentSemester?.focus}</span>
      </div>
    </Card>
  );
}
