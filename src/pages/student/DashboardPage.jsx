import React from 'react';
import { Link } from 'react-router-dom';
import { useStudent } from '../../context/StudentContext';
import { ROADMAP_SEMESTERS, SAMPLE_STUDENT } from '../../data/demoData';
import AcademicInfoCard from '../../components/dashboard/AcademicInfoCard';
import CareerGoalCard from '../../components/dashboard/CareerGoalCard';
import ProgressCard from '../../components/dashboard/ProgressCard';
import SkillBreakdownCard from '../../components/dashboard/SkillBreakdownCard';
import RoadmapPreviewCard from '../../components/dashboard/RoadmapPreviewCard';
import NextActivityCard from '../../components/dashboard/NextActivityCard';
import LearningPreferencesCard from '../../components/dashboard/LearningPreferencesCard';
import Button from '../../components/common/Button';
import { Info, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { student, currentReadiness } = useStudent();

  // Pick or derive next learning recommendation based on student's missing skills or first skill to tackle
  const nextActivity = {
    title: `Mastering Core ${student?.targetRole || 'Full Stack'} Essentials`,
    platform: 'freeCodeCamp & Official Docs',
    estimatedTime: '45 mins',
    type: 'Guided Hands-on Tutorial',
    skill: student?.skills?.find((s) => s.level === 'Beginner')?.name || 'REST API Foundations',
    description: `Targeted practice for ${student?.name || 'Student'} based on your ${student?.semester || 'current semester'} curriculum and learning preferences (${student?.learningPreferences?.hoursPerWeek || '5-10 hrs/week'}).`
  };

  return (
    <div className="space-y-6">
      {/* If profile is incomplete / not yet onboarded, show prominent callout */}
      {!student?.isOnboarded ? (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-brand-50 to-indigo-50 border-2 border-brand-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Complete Your Student Onboarding
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
                Your profile is not fully configured yet. Walk through our 5-step wizard to set up your semester roadmap, career interests, and self-assessed skills.
              </p>
            </div>
          </div>
          <Button
            to="/onboarding"
            variant="accent"
            size="md"
            icon={ArrowRight}
            iconPosition="right"
            className="shrink-0 shadow-sm"
          >
            Launch Wizard
          </Button>
        </div>
      ) : (
        /* Demo/Persistent state indicator */
        <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-brand-600 shrink-0" />
            <span>
              <strong>Active Profile:</strong> Loaded for <strong>{student.name}</strong> ({student.degree} in {student.branch}, {student.semester}). All changes persist to your browser's localStorage.
            </span>
          </div>
          <Link
            to="/app/profile"
            className="hidden sm:inline-block text-[11px] font-semibold text-brand-700 hover:text-brand-900 shrink-0 underline"
          >
            Edit Profile
          </Link>
        </div>
      )}

      {/* Row 1: Academic Info & Career Goal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AcademicInfoCard student={student} />
        </div>
        <div>
          <CareerGoalCard student={student} />
        </div>
      </div>

      {/* Row 2: Progress & Recommended Next Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressCard student={student} readiness={currentReadiness} />
        <NextActivityCard activity={nextActivity} />
      </div>

      {/* Row 3: Skill Breakdown & Learning Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkillBreakdownCard skills={student?.skills || []} targetRole={student?.targetRole} />
        <LearningPreferencesCard preferences={student?.learningPreferences} />
      </div>

      {/* Row 4: Roadmap Preview */}
      <div>
        <RoadmapPreviewCard semesters={ROADMAP_SEMESTERS} />
      </div>
    </div>
  );
}
