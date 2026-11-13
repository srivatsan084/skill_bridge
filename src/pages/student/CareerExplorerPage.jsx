import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  Search,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Database,
  AlertCircle,
  RefreshCw,
  BarChart3,
  Layers,
  ExternalLink,
  ChevronRight,
  Info,
  SlidersHorizontal,
  X,
  GitCompare,
  Award,
  CheckCircle2
} from 'lucide-react';
import apiService from '../../services/api';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export default function CareerExplorerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedRoleParam = searchParams.get('role');

  // Industry roles list state
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [rolesError, setRolesError] = useState(null);
  const [totalPostingsAnalyzed, setTotalPostingsAnalyzed] = useState(0);
  const [datasetSource, setDatasetSource] = useState('Kaggle LinkedIn Job Postings Dataset');

  // Filter and sort state for roles catalog
  const [roleSearchTerm, setRoleSearchTerm] = useState('');
  const [roleSortBy, setRoleSortBy] = useState('postings-desc');

  // Active selected role details state
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleDetails, setRoleDetails] = useState(null);
  const [loadingRoleDetails, setLoadingRoleDetails] = useState(false);
  const [roleDetailsError, setRoleDetailsError] = useState(null);

  // Filter state for skills inside selected role
  const [skillSearchTerm, setSkillSearchTerm] = useState('');
  const [frequencyTier, setFrequencyTier] = useState('all');

  // 1. Fetch available career roles from MongoDB backend
  const fetchRoles = async () => {
    setLoadingRoles(true);
    setRolesError(null);
    try {
      const res = await apiService.industry.getRoles();
      if (res && res.success && Array.isArray(res.roles)) {
        setRoles(res.roles);
        if (res.totalPostingsAnalyzed) {
          setTotalPostingsAnalyzed(res.totalPostingsAnalyzed);
        } else if (res.totalAnalyzedPostings) {
          setTotalPostingsAnalyzed(res.totalAnalyzedPostings);
        } else {
          const sum = res.roles.reduce((acc, r) => acc + (r.totalPostings || 0), 0);
          setTotalPostingsAnalyzed(sum);
        }

        if (res.datasetSource) {
          setDatasetSource(res.datasetSource);
        }
      } else {
        throw new Error(res?.message || 'Failed to retrieve industry career roles.');
      }
    } catch (err) {
      console.error('Error loading industry roles:', err);
      setRolesError(
        err.message || 'Unable to connect to the industry data service. Please make sure the backend is running.'
      );
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // 2. Fetch specific role skills when a role is selected or URL param changes
  const fetchRoleSkills = async (roleIdentifier) => {
    if (!roleIdentifier) return;
    setLoadingRoleDetails(true);
    setRoleDetailsError(null);
    try {
      const res = await apiService.industry.getRoleSkills(roleIdentifier);
      if (res && res.success) {
        // Ensure skills are sorted descending by mention percentage / count
        const sortedSkills = (res.skills || []).slice().sort((a, b) => {
          if (b.percentage !== a.percentage) {
            return b.percentage - a.percentage;
          }
          return b.mentionCount - a.mentionCount;
        });

        setRoleDetails({
          ...res,
          skills: sortedSkills
        });
      } else {
        throw new Error(res?.message || `Failed to fetch skill data for '${roleIdentifier}'.`);
      }
    } catch (err) {
      console.error(`Error loading skills for role '${roleIdentifier}':`, err);
      setRoleDetailsError(
        err.message || 'Unable to load skill statistics for this career role. Please try again.'
      );
    } finally {
      setLoadingRoleDetails(false);
    }
  };

  // Sync selected role when roles list or URL param changes
  useEffect(() => {
    if (selectedRoleParam && roles.length > 0) {
      const matched = roles.find(
        (r) =>
          r.roleSlug?.toLowerCase() === selectedRoleParam.toLowerCase() ||
          r.role?.toLowerCase() === selectedRoleParam.toLowerCase()
      );
      if (matched) {
        setSelectedRole(matched);
        fetchRoleSkills(matched.roleSlug || matched.role);
      } else {
        // Fallback: try querying directly by param
        setSelectedRole({ role: selectedRoleParam, roleSlug: selectedRoleParam });
        fetchRoleSkills(selectedRoleParam);
      }
    } else if (!selectedRoleParam) {
      setSelectedRole(null);
      setRoleDetails(null);
      setRoleDetailsError(null);
    }
  }, [selectedRoleParam, roles]);

  // Handler to select role and sync with URL
  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setSkillSearchTerm('');
    setFrequencyTier('all');
    setSearchParams({ role: role.roleSlug || role.role });
    fetchRoleSkills(role.roleSlug || role.role);
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler to clear selected role and return to all roles
  const handleClearSelectedRole = () => {
    setSelectedRole(null);
    setRoleDetails(null);
    setRoleDetailsError(null);
    setSearchParams({});
  };

  // Filter & sort available career roles
  const filteredRoles = useMemo(() => {
    return roles
      .filter((r) => {
        const query = roleSearchTerm.toLowerCase().trim();
        if (!query) return true;
        return (
          r.role.toLowerCase().includes(query) ||
          r.roleSlug?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (roleSortBy === 'postings-desc') return (b.totalPostings || 0) - (a.totalPostings || 0);
        if (roleSortBy === 'skills-desc') {
          const aCount = a.skillCount ?? a.skillsCount ?? 0;
          const bCount = b.skillCount ?? b.skillsCount ?? 0;
          return bCount - aCount;
        }
        if (roleSortBy === 'name-asc') return a.role.localeCompare(b.role);
        return 0;
      });
  }, [roles, roleSearchTerm, roleSortBy]);

  // Filter skills within the selected role
  const filteredSkills = useMemo(() => {
    if (!roleDetails?.skills) return [];
    return roleDetails.skills.filter((item) => {
      // Search filter
      const matchesSearch =
        !skillSearchTerm.trim() ||
        item.skill.toLowerCase().includes(skillSearchTerm.toLowerCase().trim());

      // Tier filter
      let matchesTier = true;
      if (frequencyTier === 'high') {
        matchesTier = item.percentage >= 30;
      } else if (frequencyTier === 'moderate') {
        matchesTier = item.percentage >= 15 && item.percentage < 30;
      } else if (frequencyTier === 'specialized') {
        matchesTier = item.percentage < 15;
      }

      return matchesSearch && matchesTier;
    });
  }, [roleDetails, skillSearchTerm, frequencyTier]);

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. Header Banner & Dataset Metrics                       */}
      {/* ======================================================== */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge variant="blue" size="sm">
              Industry Intelligence
            </Badge>
            <span className="text-xs text-slate-500 font-medium">
              Verified Hiring Dataset
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Career Explorer</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Explore industry demand across tech roles based on authentic job postings from the{' '}
            <span className="font-semibold text-slate-700">{datasetSource}</span>. Benchmark skill expectations
            and discover prevailing market trends.
          </p>
        </div>

        {/* Aggregate KPI counters */}
        <div className="shrink-0 flex flex-wrap sm:flex-nowrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Briefcase className="w-4 h-4 text-brand-600 shrink-0" />
            <span>
              <strong className="text-slate-900 font-bold">{roles.length || 13}</strong> Career Roles
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-700 bg-emerald-50/60 px-3 py-2 rounded-xl border border-emerald-200">
            <Database className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong className="text-emerald-900 font-bold">
                {totalPostingsAnalyzed ? totalPostingsAnalyzed.toLocaleString() : '3,804'}
              </strong>{' '}
              Analyzed Postings
            </span>
          </div>
        </div>
      </div>

      {/* Advisory Note (Non-mandatory disclaimer) */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 sm:p-4 flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="font-semibold text-amber-950">Market Demand Advisory:</strong> Skill percentages indicate
          how frequently specific technologies were mentioned in job postings for each role within our analyzed
          dataset. These figures illustrate market demand frequency and prevailing industry expectations—they are{' '}
          <strong className="underline">not</strong> compulsory or mandatory prerequisites for every job opportunity.
        </p>
      </div>

      {/* ======================================================== */}
      {/* 2. Error State for Roles Fetching                        */}
      {/* ======================================================== */}
      {rolesError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="text-base font-bold text-rose-900">Unable to Load Industry Roles</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{rolesError}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchRoles}
            icon={RefreshCw}
            className="border-rose-300 text-rose-800 hover:bg-rose-100"
          >
            Retry Connection
          </Button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. Loading State for Roles Catalog                       */}
      {/* ======================================================== */}
      {loadingRoles && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 animate-pulse">
            <span>Connecting to MongoDB industry database...</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 animate-pulse"
              >
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between">
                  <div className="h-7 bg-slate-200 rounded w-1/3" />
                  <div className="h-7 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. Active Role Detail View (When a role is selected)     */}
      {/* ======================================================== */}
      {!loadingRoles && !rolesError && selectedRole && (
        <div className="space-y-6">
          {/* Breadcrumb & Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-4 py-3 rounded-xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={handleClearSelectedRole}
                className="flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-800 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Roles</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-slate-900 font-bold truncate">{selectedRole.role}</span>
            </div>

            {/* Quick role switcher */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium hidden md:inline">Switch Role:</span>
              <select
                value={selectedRole.roleSlug || selectedRole.role}
                onChange={(e) => {
                  const target = roles.find(
                    (r) => r.roleSlug === e.target.value || r.role === e.target.value
                  );
                  if (target) handleSelectRole(target);
                }}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {roles.map((r) => (
                  <option key={r.roleSlug || r.role} value={r.roleSlug || r.role}>
                    {r.role} ({r.totalPostings} postings)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Role Hero Card */}
          <div className="bg-gradient-to-br from-slate-900 via-brand-navy to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="blue" size="xs">
                    Career Role Profile
                  </Badge>
                  <span className="text-xs text-slate-300">
                    Source: {roleDetails?.datasetSource || datasetSource}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {selectedRole.role}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                  {roleDetails
                    ? `Based on ${roleDetails.totalPostings.toLocaleString()} analyzed job postings. Discover which skills employers look for most frequently in this role.`
                    : 'Loading role statistics...'}
                </p>
              </div>

              {/* Stat Counters for Selected Role */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-center min-w-[120px]">
                  <span className="text-[11px] uppercase tracking-wider text-slate-300 block font-medium">
                    Analyzed Postings
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-white">
                    {roleDetails?.totalPostings?.toLocaleString() ?? selectedRole.totalPostings ?? '...'}
                  </span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-center min-w-[120px]">
                  <span className="text-[11px] uppercase tracking-wider text-slate-300 block font-medium">
                    Skills Identified
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-emerald-400">
                    {roleDetails?.totalSkills ??
                      roleDetails?.skills?.length ??
                      selectedRole.skillCount ??
                      selectedRole.skillsCount ??
                      '...'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom action to jump to Skill Gap */}
            <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
              <span>Want to benchmark your own profile against these industry requirements?</span>
              <Button
                to="/app/skill-gap"
                variant="accent"
                size="sm"
                icon={GitCompare}
                iconPosition="right"
                className="self-start sm:self-auto font-medium"
              >
                Analyze My Skill Gap
              </Button>
            </div>
          </div>

          {/* Loading skills */}
          {loadingRoleDetails && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
              <RefreshCw className="w-6 h-6 text-brand-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-600 font-medium">
                Fetching skills and mention frequency for {selectedRole.role}...
              </p>
            </div>
          )}

          {/* Error loading skills */}
          {roleDetailsError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
              <h3 className="text-base font-bold text-rose-900">Failed to Load Role Skills</h3>
              <p className="text-xs text-rose-700 max-w-md mx-auto">{roleDetailsError}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchRoleSkills(selectedRole.roleSlug || selectedRole.role)}
                icon={RefreshCw}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Skills Breakdown Content */}
          {!loadingRoleDetails && !roleDetailsError && roleDetails && (
            <div className="space-y-4">
              {/* Filter & Search Bar within Role Skills */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={`Filter skills in ${selectedRole.role} (e.g. React, SQL, Python)...`}
                    value={skillSearchTerm}
                    onChange={(e) => setSkillSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50 focus:bg-white"
                  />
                  {skillSearchTerm && (
                    <button
                      onClick={() => setSkillSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Demand frequency tier filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
                  <span className="text-slate-500 font-medium text-[11px] whitespace-nowrap mr-1">
                    Frequency:
                  </span>
                  {[
                    { id: 'all', label: `All (${roleDetails.skills?.length || 0})` },
                    {
                      id: 'high',
                      label: `High ≥30% (${
                        roleDetails.skills?.filter((s) => s.percentage >= 30).length || 0
                      })`
                    },
                    {
                      id: 'moderate',
                      label: `Moderate 15-29% (${
                        roleDetails.skills?.filter((s) => s.percentage >= 15 && s.percentage < 30)
                          .length || 0
                      })`
                    },
                    {
                      id: 'specialized',
                      label: `Specialized <15% (${
                        roleDetails.skills?.filter((s) => s.percentage < 15).length || 0
                      })`
                    }
                  ].map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => setFrequencyTier(tier.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        frequencyTier === tier.id
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skills Listing Header Summary */}
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>
                  Showing <strong className="text-slate-800">{filteredSkills.length}</strong> of{' '}
                  <strong className="text-slate-800">{roleDetails.skills?.length}</strong> identified skills
                  sorted by mention frequency
                </span>
                <span className="text-[11px]">
                  Sample size: {roleDetails.totalPostings.toLocaleString()} postings
                </span>
              </div>

              {/* Skills Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSkills.map((item, index) => {
                  const percentage = Number(item.percentage) || 0;
                  const mentionCount = Number(item.mentionCount) || 0;

                  // Dynamic color styles based on demand frequency
                  let tierColor = 'bg-slate-600';
                  let badgeVariant = 'slate';
                  let tierLabel = 'Specialized Demand';

                  if (percentage >= 40) {
                    tierColor = 'bg-emerald-600';
                    badgeVariant = 'emerald';
                    tierLabel = 'Very High Frequency';
                  } else if (percentage >= 25) {
                    tierColor = 'bg-brand-600';
                    badgeVariant = 'blue';
                    tierLabel = 'High Frequency';
                  } else if (percentage >= 15) {
                    tierColor = 'bg-indigo-600';
                    badgeVariant = 'purple';
                    tierLabel = 'Moderate Frequency';
                  }

                  return (
                    <div
                      key={item.skill || index}
                      className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between gap-3"
                    >
                      <div>
                        {/* Skill Header */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-400 w-5">
                              #{index + 1}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900">{item.skill}</h4>
                          </div>
                          <Badge variant={badgeVariant} size="xs">
                            {percentage.toFixed(1)}% Mentioned
                          </Badge>
                        </div>

                        {/* Frequency details */}
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                          <span>
                            Mentioned in <strong className="text-slate-700">{mentionCount}</strong> of{' '}
                            {roleDetails.totalPostings} job postings
                          </span>
                          <span className="text-[11px] font-medium text-slate-400">
                            {tierLabel}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full transition-all duration-500 ${tierColor}`}
                            style={{ width: `${Math.min(100, Math.max(2, percentage))}%` }}
                            title={`${item.skill}: ${percentage}% mention frequency`}
                          />
                        </div>
                      </div>

                      {/* Footer micro-details */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Frequency: {percentage}%</span>
                        <Link
                          to={`/app/skill-gap?role=${encodeURIComponent(selectedRole.role)}`}
                          className="text-brand-600 hover:text-brand-800 font-medium inline-flex items-center gap-1"
                        >
                          Check in Gap Analysis <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Empty state within skills */}
              {filteredSkills.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
                  <p className="text-xs text-slate-500">
                    No skills matched "{skillSearchTerm}" in {selectedRole.role}.
                  </p>
                  <Button
                    onClick={() => {
                      setSkillSearchTerm('');
                      setFrequencyTier('all');
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    Reset Skill Filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. Career Roles Catalog Grid (Main Overview)             */}
      {/* ======================================================== */}
      {!loadingRoles && !rolesError && !selectedRole && (
        <div className="space-y-6">
          {/* Search, Filter, and Sort Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search available career roles (e.g. Full Stack, Data Analyst, DevOps)..."
                value={roleSearchTerm}
                onChange={(e) => setRoleSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50 focus:bg-white"
              />
              {roleSearchTerm && (
                <button
                  onClick={() => setRoleSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Sort by:</span>
              <select
                value={roleSortBy}
                onChange={(e) => setRoleSortBy(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="postings-desc">Highest Job Postings</option>
                <option value="skills-desc">Most Skills Identified</option>
                <option value="name-asc">Role Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Showing <strong className="text-slate-800">{filteredRoles.length}</strong> of{' '}
              <strong className="text-slate-800">{roles.length}</strong> career roles from MongoDB
            </span>
            <span>Click any role to view detailed skill frequencies</span>
          </div>

          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRoles.map((role) => {
              const skillCount = role.skillCount ?? role.skillsCount ?? 0;
              const postings = role.totalPostings || 0;

              return (
                <Card
                  key={role.roleSlug || role.role}
                  hover
                  className="flex flex-col justify-between cursor-pointer border-slate-200/90 hover:border-brand-300"
                >
                  <div className="space-y-3" onClick={() => handleSelectRole(role)}>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-brand-500" />
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Industry Track
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                          {role.role}
                        </h3>
                      </div>
                      <Badge variant="blue" size="xs">
                        Verified
                      </Badge>
                    </div>

                    {/* Metric Pills */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-center">
                        <span className="text-[10px] text-slate-400 block font-medium">
                          Analyzed Postings
                        </span>
                        <span className="text-sm font-bold text-slate-800">
                          {postings.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-center">
                        <span className="text-[10px] text-slate-400 block font-medium">
                          Identified Skills
                        </span>
                        <span className="text-sm font-bold text-emerald-700">
                          {skillCount} skills
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      Real-world frequency metrics and technology distribution mapped from {postings.toLocaleString()}{' '}
                      verified job postings.
                    </p>
                  </div>

                  {/* Card bottom CTA */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Source: Kaggle Dataset
                    </span>
                    <Button
                      onClick={() => handleSelectRole(role)}
                      variant="primary"
                      size="sm"
                      icon={ArrowRight}
                      iconPosition="right"
                    >
                      Explore Role
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Empty search results */}
          {filteredRoles.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8 space-y-3">
              <p className="text-sm text-slate-500">
                No career roles found matching "{roleSearchTerm}".
              </p>
              <Button
                onClick={() => {
                  setRoleSearchTerm('');
                  setRoleSortBy('postings-desc');
                }}
                variant="secondary"
                size="sm"
              >
                Reset Search Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty State if MongoDB has 0 roles */}
      {!loadingRoles && !rolesError && roles.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8 space-y-3">
          <Database className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Industry Roles Available</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            The industry dataset has not been imported into the MongoDB database yet. Run the import script on the
            backend to populate career roles.
          </p>
          <Button onClick={fetchRoles} variant="primary" size="sm" icon={RefreshCw}>
            Refresh
          </Button>
        </div>
      )}
    </div>
  );
}
