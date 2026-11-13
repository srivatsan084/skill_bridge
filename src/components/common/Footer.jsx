import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ExternalLink, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">SkillBridge</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              SkillBridge is an open college community initiative designed to help first, second, and third-year
              engineering students bridge the gap between academic syllabus and modern industry expectations through
              semester-wise roadmaps and skill gap awareness.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Free, non-commercial educational project for students.</span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/app" className="text-slate-400 hover:text-white transition-colors">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link to="/app/careers" className="text-slate-400 hover:text-white transition-colors">
                  Career Explorer
                </Link>
              </li>
              <li>
                <Link to="/app/skill-gap" className="text-slate-400 hover:text-white transition-colors">
                  Skill Gap Analysis
                </Link>
              </li>
              <li>
                <Link to="/app/roadmap" className="text-slate-400 hover:text-white transition-colors">
                  Semester Roadmap
                </Link>
              </li>
              <li>
                <Link to="/app/resources" className="text-slate-400 hover:text-white transition-colors">
                  Free Learning Resources
                </Link>
              </li>
            </ul>
          </div>

          {/* Inspiration & Project Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">References & Ethics</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-slate-400 hover:text-white transition-colors">
                  About the Project
                </Link>
              </li>
              <li>
                <a
                  href="https://roadmap.sh/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                >
                  roadmap.sh <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.freecodecamp.org/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                >
                  freeCodeCamp <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.onetonline.org/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                >
                  O*NET OnLine <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer statement */}
        <div className="mt-12 pt-8 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            Important Notice: SkillBridge provides structured learning recommendations and curriculum insights. It does not guarantee employment, placements, or recruitment outcomes.
          </p>
          <p className="shrink-0 flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-rose-400 inline" /> for Engineering Students
          </p>
        </div>
      </div>
    </footer>
  );
}
