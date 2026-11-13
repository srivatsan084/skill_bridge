import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, BookOpen, Globe, ShieldCheck, ArrowRight } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';

export default function LearningPreferencesCard({ preferences }) {
  if (!preferences) return null;

  return (
    <Card
      title="Learning Preferences & Schedule"
      subtitle="Your configured study style and resource filters"
      action={
        <Link
          to="/app/profile"
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
        >
          Edit Preferences <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Hours / Week */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Weekly Commitment</span>
            <span className="font-semibold text-slate-800">{preferences.hoursPerWeek}</span>
          </div>
        </div>

        {/* Resource policy */}
        <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-[11px] text-emerald-700 font-medium block">Cost Filter</span>
            <span className="font-semibold text-emerald-900">
              {preferences.preferFreeOnly ? 'Strictly 100% Free Resources' : 'Open to Paid & Free'}
            </span>
          </div>
        </div>

        {/* Preferred formats */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
          <BookOpen className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Preferred Formats</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {preferences.formats?.map((fmt) => (
                <Badge key={fmt} variant="purple" size="xs">
                  {fmt}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
          <Globe className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Preferred Language</span>
            <span className="font-semibold text-slate-800">{preferences.language || 'English'}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
