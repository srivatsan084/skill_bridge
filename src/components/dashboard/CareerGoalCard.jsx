import React from 'react';
import { Target, ArrowRight, Sparkles } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { CAREER_GOALS_LIST } from '../../data/onboardingData';

export default function CareerGoalCard({ student }) {
  if (!student) return null;

  const targetRole = student.targetRole || 'Full Stack Developer';
  const roleInfo = CAREER_GOALS_LIST.find((r) => r.title === targetRole);
  const secondaryInterests = student.secondaryInterests || [];

  return (
    <Card
      title="Target Career Track"
      subtitle="Your active learning goal"
      action={<Badge variant="blue">Primary Goal</Badge>}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-brand-600 shrink-0">
          <Target className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-bold text-slate-900 truncate">{targetRole}</h4>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-3">
            {roleInfo?.description ||
              'Focused on industry-demanded competencies and structured semester roadmap milestones.'}
          </p>
        </div>
      </div>

      {secondaryInterests.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Secondary Interests
          </span>
          <div className="flex flex-wrap gap-1.5">
            {secondaryInterests.map((interest) => (
              <Badge key={interest} variant="purple" size="xs">
                {interest}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500">Need to switch career track?</span>
        <Button to="/app/careers" variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">
          Explore Roles
        </Button>
      </div>
    </Card>
  );
}
