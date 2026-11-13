import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  Target,
  GitCompare,
  Milestone,
  BookOpen,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  GraduationCap,
  Layers,
  Search,
  ExternalLink
} from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

export default function HomePage() {
  return (
    <div className="space-y-20 lg:space-y-28 pb-16">
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-16 lg:pt-20 lg:pb-24 overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-brand-50/60 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/70 border border-blue-200 text-brand-800 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>College Community Career Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Build the Skills Your Future Career Needs.
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed font-normal">
              SkillBridge connects engineering students' current syllabus and coursework with modern industry
              expectations. Discover your target career role, analyze what skills you are missing, and follow a
              semester-by-semester roadmap using free, high-quality learning resources.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button to="/register" variant="primary" size="lg" icon={ArrowRight} iconPosition="right" className="w-full sm:w-auto shadow-md">
                Get Started
              </Button>
              <Button to="/app/careers" variant="secondary" size="lg" icon={Target} className="w-full sm:w-auto">
                Explore Careers
              </Button>
            </div>

            <div className="pt-4 flex items-center justify-center gap-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Free & Non-commercial
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> For 1st, 2nd & 3rd Year Engineers
              </span>
            </div>
          </div>

          {/* 3-STEP PROCESS VISUAL CARD */}
          <div className="mt-14 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 sm:p-8">
              <div className="text-center mb-8">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600">The SkillBridge Flow</span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  How Students Bridge the Gap in 3 Guided Steps
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                {/* Step 1 */}
                <div className="relative p-5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-start group hover:border-brand-200 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-brand-700 flex items-center justify-center font-bold text-base mb-4">
                    1
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">Discover Your Career</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Explore curated tech career tracks tailored to your engineering discipline, starting from your current academic semester.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 w-full flex items-center gap-1.5 text-xs text-brand-600 font-medium">
                    <Target className="w-3.5 h-3.5" />
                    <span>Choose your goal</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative p-5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-start group hover:border-brand-200 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-base mb-4">
                    2
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">Identify Your Skill Gaps</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Compare your existing course skills against industry role benchmarks to uncover missing frameworks, tools, and practices.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 w-full flex items-center gap-1.5 text-xs text-purple-600 font-medium">
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>Spot missing skills</span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative p-5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-start group hover:border-brand-200 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base mb-4">
                    3
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">Personalised Learning Roadmap</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Follow milestone-driven semester targets powered by genuine free tutorials from official docs and freeCodeCamp.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 w-full flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                    <Milestone className="w-3.5 h-3.5" />
                    <span>Follow the roadmap</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THREE MAIN OBJECTIVES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <Badge variant="blue">Project Objectives</Badge>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Built Around What Engineering Students Genuinely Need
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            SkillBridge tackles the three major hurdles students face when preparing for software engineering roles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Objective 1 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center">
                <Milestone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                1. Career Guidance & Personalised Learning Roadmaps
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Most students are unsure what to learn in each semester. SkillBridge takes your academic year,
                semester, current foundation, and desired track, then constructs a realistic semester-wise roadmap
                that complements your university examinations.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-100 mt-6">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Focus</span>
              <p className="text-xs text-slate-700 font-medium mt-1">Realistic pacing without academic burnout</p>
            </div>
          </div>

          {/* Objective 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <GitCompare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                2. AI-Based Skill Gap Analysis
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Rather than guessing what companies expect, SkillBridge benchmarks your current competencies
                against junior role expectations extracted from real job postings, highlighting weak and missing skills.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-100 mt-6">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Focus</span>
              <p className="text-xs text-slate-700 font-medium mt-1">Objective diagnosis before recruitment starts</p>
            </div>
          </div>

          {/* Objective 3 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                3. Free Learning-Resource Recommendations
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Students do not need costly bootcamps. The internet has world-class free materials from official
                documentation, open-source communities, and verified YouTube tutorials. SkillBridge curates the best free options.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-100 mt-6">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Focus</span>
              <p className="text-xs text-slate-700 font-medium mt-1">100% Free, high quality, accessible to all</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW SKILLBRIDGE WORKS SECTION */}
      <section className="bg-slate-100/70 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12 space-y-3">
            <Badge variant="purple">Architecture</Badge>
            <h2 className="text-3xl font-extrabold text-slate-900">How SkillBridge Works</h2>
            <p className="text-sm text-slate-600">
              Clear logic: Understanding what to learn, why to learn it, and how to learn it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm space-y-2">
              <div className="text-xs font-bold text-brand-600 uppercase">Phase 1</div>
              <h4 className="font-bold text-slate-900 text-sm">Student Profile Input</h4>
              <p className="text-xs text-slate-600">
                Select your engineering discipline, current semester, existing coding experience, and career aspirations.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm space-y-2">
              <div className="text-xs font-bold text-brand-600 uppercase">Phase 2</div>
              <h4 className="font-bold text-slate-900 text-sm">Role Benchmark Matching</h4>
              <p className="text-xs text-slate-600">
                Match against standard developer profiles (Frontend, Full-Stack, Backend, Cloud/DevOps, Data Analysis).
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm space-y-2">
              <div className="text-xs font-bold text-brand-600 uppercase">Phase 3</div>
              <h4 className="font-bold text-slate-900 text-sm">Automated Gap Detection</h4>
              <p className="text-xs text-slate-600">
                Identify which critical libraries, protocols, tools, or architectures are missing from your current skill set.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm space-y-2">
              <div className="text-xs font-bold text-brand-600 uppercase">Phase 4</div>
              <h4 className="font-bold text-slate-900 text-sm">Semester Action Plan</h4>
              <p className="text-xs text-slate-600">
                Get a milestone roadmap paired directly with verified free tutorials from freeCodeCamp, MDN, and official docs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS FOR ENGINEERING STUDENTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <Badge variant="emerald">Student-Centric</Badge>
          <h2 className="text-3xl font-extrabold text-slate-900">Tailored by Academic Year</h2>
          <p className="text-sm text-slate-600">
            Every stage of engineering demands a different strategic focus.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-50 text-brand-700">1st Year Students</span>
            <h3 className="text-base font-bold text-slate-900">Foundations & Exploration</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Build a solid programming foundation in C/C++ or Python, understand version control with Git, and explore different career directions before committing.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-purple-50 text-purple-700">2nd Year Students</span>
            <h3 className="text-base font-bold text-slate-900">Stack Specialisation & Projects</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pick a tech stack (e.g. MERN or Cloud Backend), learn modern frameworks, and start developing full-stack projects beyond classroom toy programs.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700">3rd Year Students</span>
            <h3 className="text-base font-bold text-slate-900">Gap Closure & Internship Readiness</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Detect remaining skill gaps, polish production capstones, master DSA problem solving, and prepare technical portfolios for internship opportunities.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 lg:p-16 text-center text-white relative overflow-hidden shadow-xl">
          <div className="max-w-2xl mx-auto space-y-6 relative z-10">
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-brand-300 bg-slate-800 px-3 py-1 rounded-full">
              Start Your Roadmap Today
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Take Charge of Your Engineering Journey.
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Understand what skills you need, check where you stand today, and follow a clear, semester-aligned path using free learning resources.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button to="/register" variant="accent" size="lg" icon={ArrowRight} iconPosition="right">
                Create Free Student Profile
              </Button>
              <Button to="/app" variant="secondary" size="lg">
                View Live Demo Dashboard
              </Button>
            </div>
            <p className="text-[11px] text-slate-400 pt-3">
              Non-commercial college initiative. No credit card, no subscription, 100% free learning resources.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
