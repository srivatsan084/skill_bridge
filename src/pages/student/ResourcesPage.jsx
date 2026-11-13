import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  ExternalLink,
  ShieldCheck,
  Video,
  FileText,
  Sparkles,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { LEARNING_RESOURCES } from '../../data/demoData';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export default function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Frontend', 'Backend', 'Databases', 'Languages', 'Tools', 'Career Guidance'];

  const filteredResources = LEARNING_RESOURCES.filter((res) => {
    const matchesCat = selectedCategory === 'All' || res.category === selectedCategory;
    const matchesSearch =
      res.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.skill.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="emerald">100% Free Materials</Badge>
            <span className="text-xs text-slate-500 font-medium">Verified Community & Official Docs</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Curated Learning Resources</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            High-quality tutorials, official documentation, and complete courses to close your identified skill gaps
            without paying for expensive bootcamps.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2 text-xs bg-emerald-50 text-emerald-800 px-3 py-2 rounded-xl border border-emerald-200 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Zero Paid / Commercial Links</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by topic, provider, or skill (e.g. React, Express, Git)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-brand-navy text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((res) => (
          <Card key={res.id} hover className="flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="blue" size="xs">{res.category}</Badge>
                <Badge variant="emerald" size="xs">{res.cost}</Badge>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                  {res.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  By {res.provider} • <span className="text-slate-700">{res.format}</span>
                </p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {res.description}
              </p>

              <div className="pt-2 flex flex-wrap gap-1.5">
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  Skill: {res.skill}
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                  Level: {res.level}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <Button
                href={res.url}
                variant="outline"
                size="sm"
                className="w-full justify-center"
                icon={ExternalLink}
                iconPosition="right"
              >
                Access Free Resource
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8 space-y-3">
          <p className="text-sm text-slate-500">No resources found matching your search term.</p>
          <Button onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }} variant="secondary" size="sm">
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
}
