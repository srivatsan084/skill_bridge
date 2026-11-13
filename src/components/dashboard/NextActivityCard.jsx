import React from 'react';
import { Compass, Clock, BookOpen, ExternalLink, ArrowRight } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';

export default function NextActivityCard({ activity }) {
  if (!activity) return null;

  return (
    <Card
      title="Recommended Next Learning Activity"
      subtitle="Curated step to address your highest priority skill gap"
      action={<Badge variant="purple">Priority Task</Badge>}
    >
      <div className="bg-gradient-to-br from-brand-50 to-indigo-50/40 p-4 rounded-xl border border-brand-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="blue" size="xs">{activity.skill}</Badge>
              <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {activity.estimatedTime}
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900">{activity.title}</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{activity.description}</p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-brand-100/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-500 font-medium">
            Provider: <strong className="text-slate-700">{activity.platform}</strong>
          </span>

          <div className="flex items-center gap-2">
            <Button
              to="/app/resources"
              variant="secondary"
              size="sm"
            >
              Browse All Resources
            </Button>
            <Button
              href="https://www.freecodecamp.org/news/how-to-build-a-rest-api-with-node-js-and-express/"
              variant="accent"
              size="sm"
              icon={ExternalLink}
              iconPosition="right"
            >
              Start Free Tutorial
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
