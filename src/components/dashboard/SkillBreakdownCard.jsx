import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, ArrowUpRight, Plus } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { Link } from 'react-router-dom';

const ROLE_BENCHMARK_SKILLS = {
  'Frontend Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'Tailwind CSS', 'Git', 'Testing'],
  'Backend Developer': ['JavaScript', 'Node.js', 'Express.js', 'MongoDB', 'SQL', 'Git', 'REST APIs'],
  'Full Stack Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Express.js', 'MongoDB', 'Git'],
  'Software Developer': ['C++', 'Java', 'Data Structures', 'Problem Solving', 'Git', 'SQL'],
  'Data Analyst': ['Python', 'SQL', 'MySQL', 'Problem Solving', 'Excel'],
  'Data Scientist': ['Python', 'SQL', 'Data Structures', 'Problem Solving', 'Statistics'],
  'AI/ML Engineer': ['Python', 'Data Structures', 'Problem Solving', 'C++', 'PyTorch'],
  'Cloud Engineer': ['Python', 'Node.js', 'Git', 'GitHub', 'Linux', 'Docker'],
  'DevOps Engineer': ['Git', 'GitHub', 'Python', 'Node.js', 'Docker', 'CI/CD'],
  'Cybersecurity Analyst': ['Python', 'C', 'Problem Solving', 'Git', 'Networking']
};

export default function SkillBreakdownCard({ skills = [], targetRole = 'Full Stack Developer' }) {
  const [activeTab, setActiveTab] = useState('acquired');

  const benchmark = ROLE_BENCHMARK_SKILLS[targetRole] || ROLE_BENCHMARK_SKILLS['Full Stack Developer'];

  // Missing or weak skills
  const missingSkills = benchmark
    .filter((req) => !skills.some((s) => s.name.toLowerCase() === req.toLowerCase()))
    .map((name) => ({
      name,
      status: 'Missing in Profile',
      urgency: 'High',
      recommendation: 'Recommended to study next semester'
    }));

  const beginnerSkills = skills
    .filter((s) => s.level === 'Beginner')
    .map((s) => ({
      name: s.name,
      status: 'Beginner Self-Assessment',
      urgency: 'Medium',
      recommendation: 'Practice building mini-projects to reach Intermediate'
    }));

  const skillsToImprove = [...missingSkills, ...beginnerSkills];

  return (
    <Card
      title="Skill Inventory & Gap Breakdown"
      subtitle={`Evaluated against ${targetRole}`}
      action={
        <Link
          to="/app/skill-gap"
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
        >
          Detailed Gap Analysis <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      }
    >
      {/* Tabs */}
      <div className="flex border-b border-slate-100 gap-4 mb-4">
        <button
          onClick={() => setActiveTab('acquired')}
          className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'acquired'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>My Skills ({skills.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('improve')}
          className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'improve'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Identified Gaps ({skillsToImprove.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'acquired' ? (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {skills.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No skills in your profile yet.{' '}
              <Link to="/app/profile" className="text-brand-600 font-semibold underline">
                Add skills in My Profile
              </Link>
            </div>
          ) : (
            skills.map((skill, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs hover:border-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-semibold text-slate-800">{skill.name}</span>
                  <span className="text-[11px] text-slate-400">({skill.category || 'General'})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      skill.level === 'Advanced'
                        ? 'purple'
                        : skill.level === 'Intermediate'
                        ? 'blue'
                        : 'slate'
                    }
                    size="xs"
                  >
                    {skill.level || 'Beginner'}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {skillsToImprove.length === 0 ? (
            <p className="p-4 text-center text-xs text-slate-400">
              Great work! No immediate high-priority skill gaps detected for this role.
            </p>
          ) : (
            skillsToImprove.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs hover:border-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{item.recommendation}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.urgency === 'High' ? 'rose' : 'amber'} size="xs">
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  );
}
