import React, { useState } from 'react';
import {
  Milestone,
  CheckCircle2,
  Clock,
  Circle,
  Sparkles,
  Calendar,
  BookOpen,
  ArrowRight,
  Info,
  Layers,
  Award
} from 'lucide-react';
import { ROADMAP_SEMESTERS } from '../../data/demoData';
import { useStudent } from '../../context/StudentContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export default function RoadmapPage() {
  const { student } = useStudent();
  const [semesters, setSemesters] = useState(ROADMAP_SEMESTERS);

  // Toggle milestone completion locally
  const toggleMilestone = (semIndex, milestoneIndex) => {
    const updated = [...semesters];
    updated[semIndex].milestones[milestoneIndex].done = !updated[semIndex].milestones[milestoneIndex].done;
    setSemesters(updated);
  };

  const targetRole = student?.targetRole || 'Full Stack Developer';
  const currentSemester = student?.semester || 'Semester 4';
  const academicYear = student?.academicYear || 'Second Year';

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="blue">Semester Pathway</Badge>
            <span className="text-xs text-slate-500 font-medium">Goal: {targetRole}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">My Learning Roadmap</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            A balanced semester-wise plan aligned with your college examinations and internships.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2 text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
          <Calendar className="w-4 h-4 text-brand-600" />
          <span>Active: {currentSemester} ({academicYear})</span>
        </div>
      </div>

      {/* Prototype Notice */}
      <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
        <div>
          <strong>Interactive Milestone Tracking:</strong> Check off milestones below as you complete them during your semester. Changes persist during this browsing session.
        </div>
      </div>

      {/* Timeline of Semesters */}
      <div className="space-y-6">
        {semesters.map((sem, sIdx) => {
          const isCompleted = sem.status === 'completed';
          const isInProgress = sem.status === 'in-progress';
          const isUpcoming = sem.status === 'upcoming';

          return (
            <div
              key={sem.semester}
              className={`rounded-2xl border p-5 sm:p-6 transition-all ${
                isInProgress
                  ? 'bg-white border-brand-300 shadow-md ring-2 ring-brand-500/10'
                  : isCompleted
                  ? 'bg-slate-50/80 border-slate-200'
                  : 'bg-white border-slate-200 opacity-90'
              }`}
            >
              {/* Semester Top Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-700'
                        : isInProgress
                        ? 'bg-brand-navy text-white shadow-sm'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : `S${sIdx + 3}`}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{sem.semester}</h3>
                    <p className="text-xs text-slate-500">{sem.title} • {sem.focus}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isCompleted && <Badge variant="emerald">Completed Stage</Badge>}
                  {isInProgress && <Badge variant="blue">Current Semester Focus</Badge>}
                  {isUpcoming && <Badge variant="slate">Upcoming</Badge>}
                </div>
              </div>

              {/* Milestones list */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {sem.milestones.map((m, mIdx) => (
                  <div
                    key={mIdx}
                    onClick={() => toggleMilestone(sIdx, mIdx)}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      m.done
                        ? 'bg-emerald-50/50 border-emerald-200 text-slate-900'
                        : m.active
                        ? 'bg-blue-50/70 border-brand-200 text-slate-900 hover:border-brand-300'
                        : 'bg-slate-50/70 border-slate-200/80 text-slate-700 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        className="focus:outline-none"
                        aria-label="Toggle milestone completion"
                      >
                        {m.done ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : m.active ? (
                          <Clock className="w-4 h-4 text-brand-600 shrink-0 animate-pulse" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                      </button>
                      <span className={`font-medium ${m.done ? 'line-through text-slate-500' : ''}`}>
                        {m.name}
                      </span>
                    </div>

                    <span className="text-[10px] font-semibold text-slate-400 uppercase shrink-0 ml-2">
                      {m.done ? 'Done' : m.active ? 'In Progress' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
