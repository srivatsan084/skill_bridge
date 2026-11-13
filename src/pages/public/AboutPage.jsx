import React from 'react';
import { Compass, BookOpen, Layers, ShieldCheck, ExternalLink, CheckCircle2, Code2, Users } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="blue">About SkillBridge</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Bridging Academic Curricula with Modern Industry Expectations
        </h1>
        <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
          SkillBridge is an educational community initiative designed by engineering students, for engineering students.
          We provide practical clarity on what skills to build, why to build them, and how to learn them for free.
        </p>
      </div>

      {/* The Problem We Are Solving */}
      <Card title="The Problem Engineering Students Face" subtitle="Why traditional guidance falls short">
        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <p>
            Engineering curricula provide essential theoretical grounding in mathematics, discrete structures, and
            operating systems fundamentals. However, the software industry evolves at unprecedented speed. Frameworks,
            cloud containerization, modern API design, and distributed architectures are rarely taught deeply in early college semesters.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <h4 className="font-bold text-slate-900 text-xs uppercase text-brand-600">The Confusion</h4>
              <p className="text-xs text-slate-600 mt-1">
                Too many buzzwords (AI, Web3, DevOps, Full-Stack) lead students to jump between technologies without mastery.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <h4 className="font-bold text-slate-900 text-xs uppercase text-brand-600">The Expensive Myth</h4>
              <p className="text-xs text-slate-600 mt-1">
                Aggressive marketing tricks students into buying multi-thousand-rupee bootcamps when high-quality free resources exist.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <h4 className="font-bold text-slate-900 text-xs uppercase text-brand-600">The Late Realisation</h4>
              <p className="text-xs text-slate-600 mt-1">
                Students often discover required skills only in final year placement season, when time to build projects has run out.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Our 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-600 flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Semester-Aligned Pacing</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Recommendations respect the college calendar. Instead of impossible schedules, roadmaps map realistic weekly targets around semester exams.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Code2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Objective Skill Benchmarks</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Roles are mapped against real technical requirements from junior job descriptions, giving students honest feedback on missing competencies.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Zero Cost Commitment</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every recommended tutorial, documentation link, and roadmap milestone utilizes publicly available free materials from reputable authors.
          </p>
        </div>
      </div>

      {/* Conceptual Inspirations */}
      <Card title="Conceptual Inspirations & References" subtitle="Learning from world-class platforms">
        <div className="space-y-4 text-xs sm:text-sm text-slate-600">
          <p>
            SkillBridge synthesizes principles from three respected resources:
          </p>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-3">
              <span className="font-bold text-slate-900 shrink-0">roadmap.sh:</span>
              <span>Visual learning pathways and community-curated technological progressions.</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-3">
              <span className="font-bold text-slate-900 shrink-0">O*NET OnLine:</span>
              <span>Structured occupational taxonomy, competency hierarchies, and skill requirement models.</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-3">
              <span className="font-bold text-slate-900 shrink-0">freeCodeCamp:</span>
              <span>Open-access, high-quality, hands-on learning resources without financial barriers.</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Technology Roadmap */}
      <Card title="Platform Architecture & Technical Roadmap" subtitle="Clean, decoupled engineering">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900">Current Stage: Phase 1 (Frontend Foundation)</h4>
            <ul className="space-y-1.5 text-slate-600">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> React 18 with Vite</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Tailwind CSS for responsive styling</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> React Router DOM v6 navigation</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Recharts for visual gap analysis</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Lucide React icons & modular components</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900">Next Stage: Phase 2 (Backend & AI)</h4>
            <ul className="space-y-1.5 text-slate-600">
              <li className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-500" /> Node.js & Express REST APIs</li>
              <li className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-500" /> MongoDB for persistent student roadmaps</li>
              <li className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-500" /> Google Gemini AI for personalized skill gap suggestions</li>
              <li className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-500" /> Live job posting data extraction</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Ethical Statement */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800">Ethical & Transparent Educational Project:</strong> SkillBridge is dedicated to student empowerment. We do not make misleading guarantees of guaranteed campus placements or job offers. Our mission is to guide students on what skills to build, why they matter, and provide access to the best free resources to learn them.
        </div>
      </div>
    </div>
  );
}
