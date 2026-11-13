import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  GitCompare,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ArrowRight,
  Info,
  BookOpen,
  FileText,
  Upload,
  Trash2,
  Eye,
  Check,
  AlertCircle,
  Clock,
  Database,
  Layers,
  X,
  Copy,
  Calendar,
  Briefcase,
  RefreshCw,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  Wand2,
  KeyRound,
  ShieldCheck,
  ExternalLink,
  Code2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useStudent } from '../../context/StudentContext';
import { CAREER_GOALS_LIST } from '../../data/onboardingData';
import apiService from '../../services/api';

export default function SkillGapPage() {
  const { student, isAuthenticated } = useStudent();
  const [searchParams, setSearchParams] = useSearchParams();

  // Query param synchronization
  const initialRoleParam = searchParams.get('role');
  const initialTabParam = searchParams.get('tab');
  const initialSubViewParam = searchParams.get('subview');

  // Navigation tab: 'resume' (Resume Analyzer) is primary, 'comparison' is profile self-assessment
  const [activeTab, setActiveTab] = useState(initialTabParam === 'comparison' ? 'comparison' : 'resume');
  const [selectedRole, setSelectedRole] = useState(initialRoleParam || student?.targetRole || 'Full Stack Developer');

  // Resume Analyzer Sub-views: 'overview' | 'gap' | 'rewrite'
  const [resumeSubView, setResumeSubView] = useState(
    initialSubViewParam === 'gap' ? 'gap' : initialSubViewParam === 'rewrite' ? 'rewrite' : 'overview'
  );

  // Available industry roles from backend API
  const [availableRoles, setAvailableRoles] = useState([]);

  // Resume inventory state
  const [uploadedResumes, setUploadedResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState(null);

  // Resume upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [resumeTargetRole, setResumeTargetRole] = useState(initialRoleParam || student?.targetRole || 'Full Stack Developer');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Skill-gap analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [activeAnalysis, setActiveAnalysis] = useState(null);

  // AI Resume Rewrite state
  const [rewriting, setRewriting] = useState(false);
  const [rewriteError, setRewriteError] = useState('');
  const [rewriteErrorCode, setRewriteErrorCode] = useState('');
  const [activeRewrite, setActiveRewrite] = useState(null);
  const [copiedSectionId, setCopiedSectionId] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Missing skills search & frequency tier filter
  const [missingSearchTerm, setMissingSearchTerm] = useState('');
  const [missingTierFilter, setMissingTierFilter] = useState('all');

  // Extracted plain text preview modal state
  const [previewResume, setPreviewResume] = useState(null);
  const [loadingTextId, setLoadingTextId] = useState(null);
  const [fetchTextError, setFetchTextError] = useState('');
  const [copiedModalText, setCopiedModalText] = useState(false);

  const fileInputRef = useRef(null);

  // 1. Fetch available industry career roles from backend
  useEffect(() => {
    const fetchIndustryRoles = async () => {
      try {
        const res = await apiService.industry.getRoles();
        if (res?.success && Array.isArray(res.roles)) {
          setAvailableRoles(res.roles);
        }
      } catch (err) {
        console.warn('Could not fetch industry roles from API, falling back to static list:', err);
      }
    };
    fetchIndustryRoles();
  }, []);

  // 2. Fetch student resumes from MongoDB backend
  const fetchResumes = async () => {
    if (!isAuthenticated) return;
    setLoadingResumes(true);
    try {
      const res = await apiService.resume.getAll();
      if (res?.success && Array.isArray(res.resumes)) {
        setUploadedResumes(res.resumes);

        // Auto-select resume: prefer currently selected, or default to the most recent one
        setSelectedResumeId((prevId) => {
          if (prevId && res.resumes.some((r) => r._id === prevId)) {
            return prevId;
          }
          return res.resumes.length > 0 ? res.resumes[0]._id : null;
        });
      }
    } catch (err) {
      console.warn('Could not load resumes from server:', err);
    } finally {
      setLoadingResumes(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchResumes();
    }
  }, [isAuthenticated]);

  // Determine currently selected resume object
  const selectedResume = useMemo(() => {
    if (!uploadedResumes || uploadedResumes.length === 0) return null;
    if (!selectedResumeId) return uploadedResumes[0];
    return uploadedResumes.find((r) => r._id === selectedResumeId) || uploadedResumes[0];
  }, [uploadedResumes, selectedResumeId]);

  // Synchronize target role, saved analysis, and saved rewrite when selected resume changes
  useEffect(() => {
    if (selectedResume) {
      if (selectedResume.targetRole) {
        setResumeTargetRole(selectedResume.targetRole);
      }
      // Load persisted skill gap analysis from MongoDB if available
      if (selectedResume.skillGapAnalysis) {
        setActiveAnalysis(selectedResume.skillGapAnalysis);
      } else {
        setActiveAnalysis(null);
      }
      // Load persisted AI rewrite result from MongoDB if available
      if (selectedResume.rewriteResult) {
        setActiveRewrite(selectedResume.rewriteResult);
      } else {
        setActiveRewrite(null);
      }
      setAnalysisError('');
      setRewriteError('');
      setRewriteErrorCode('');
    } else {
      setActiveAnalysis(null);
      setActiveRewrite(null);
    }
  }, [selectedResume]);

  // Handle file selection and validation (< 5MB, PDF/DOCX)
  const handleFileChange = (e) => {
    setUploadError('');
    setUploadSuccess('');
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['.pdf', '.docx'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowed.includes(ext)) {
      setUploadError('Invalid file format. Please upload a PDF (.pdf) or Word document (.docx).');
      setSelectedFile(null);
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSizeBytes) {
      setUploadError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 5 MB.`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  // Upload resume to backend and MongoDB
  const handleUploadResume = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a PDF or DOCX file to upload.');
      return;
    }

    if (!isAuthenticated) {
      setUploadError('Please sign in with a registered student account to save your resume to MongoDB.');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const res = await apiService.resume.upload(selectedFile, resumeTargetRole);
      if (res?.success) {
        setUploadSuccess(
          `Resume "${res.resume.originalFilename}" uploaded successfully. ${
            res.resume.extractedSkills?.length || 0
          } technical skills identified.`
        );
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        await fetchResumes();
        if (res.resume?._id) {
          setSelectedResumeId(res.resume._id);
        }
      }
    } catch (err) {
      setUploadError(err.message || 'Failed to upload resume. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Delete resume from disk and database
  const handleDeleteResume = async (id, originalFilename) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete "${originalFilename}"? This will delete the extracted text, skill analysis, and AI rewrite suggestions from MongoDB and remove the physical file from the server.`
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await apiService.resume.delete(id);
      if (res?.success) {
        setUploadedResumes((prev) => prev.filter((r) => r._id !== id));
        if (selectedResumeId === id) {
          setSelectedResumeId(null);
          setActiveAnalysis(null);
          setActiveRewrite(null);
        }
        if (previewResume?._id === id) {
          setPreviewResume(null);
        }
      }
    } catch (err) {
      alert(`Could not delete resume: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Execute authenticated skill gap analysis: POST /api/resume/:id/analyze-gap
  const handleAnalyzeGap = async () => {
    if (!selectedResume) {
      setAnalysisError('No resume selected. Please upload or select a resume first.');
      return;
    }

    if (!isAuthenticated) {
      setAnalysisError('Please sign in to analyze your resume against industry benchmarks.');
      return;
    }

    const targetRoleToUse = resumeTargetRole || selectedResume.targetRole;
    if (!targetRoleToUse) {
      setAnalysisError('Please select a target career role for analysis.');
      return;
    }

    setAnalyzing(true);
    setAnalysisError('');

    try {
      const res = await apiService.resume.analyzeGap(selectedResume._id, targetRoleToUse);
      if (res?.success && res.analysis) {
        setActiveAnalysis(res.analysis);
        // Update local resume object in uploadedResumes array
        setUploadedResumes((prev) =>
          prev.map((r) =>
            r._id === selectedResume._id
              ? { ...r, targetRole: res.analysis.role, skillGapAnalysis: res.analysis }
              : r
          )
        );
      } else {
        throw new Error(res?.message || 'Skill gap analysis failed.');
      }
    } catch (err) {
      console.error('Skill gap analysis error:', err);
      setAnalysisError(
        err.message || 'Unable to complete skill-gap analysis. Please ensure the backend is running.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // Execute authenticated AI resume rewrite: POST /api/resume/:id/rewrite
  const handleGenerateRewrite = async () => {
    if (!selectedResume) {
      setRewriteError('No resume selected. Please upload or select a resume first.');
      return;
    }

    if (!isAuthenticated) {
      setRewriteError('Please sign in to generate AI-powered resume improvements.');
      return;
    }

    const targetRoleToUse = resumeTargetRole || selectedResume.targetRole;
    if (!targetRoleToUse) {
      setRewriteError('Please select a target career role for the rewrite.');
      return;
    }

    setRewriting(true);
    setRewriteError('');
    setRewriteErrorCode('');

    try {
      const res = await apiService.resume.rewrite(selectedResume._id, targetRoleToUse);
      if (res?.success && res.rewriteResult) {
        setActiveRewrite(res.rewriteResult);
        // Update local resume object in uploadedResumes array
        setUploadedResumes((prev) =>
          prev.map((r) =>
            r._id === selectedResume._id
              ? { ...r, targetRole: res.rewriteResult.targetRole, rewriteResult: res.rewriteResult }
              : r
          )
        );
      } else {
        throw new Error(res?.message || 'AI rewrite generation failed.');
      }
    } catch (err) {
      console.error('Resume rewrite error:', err);
      setRewriteError(
        err.message || 'Unable to generate AI rewrite. Please check your backend configuration.'
      );
      if (err.data?.code) {
        setRewriteErrorCode(err.data.code);
      } else if (err.message?.includes('GEMINI_API_KEY')) {
        setRewriteErrorCode('CONFIG_MISSING');
      }
    } finally {
      setRewriting(false);
    }
  };

  // Copy individual section text to clipboard
  const handleCopySection = (text, sectionId) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedSectionId(sectionId);
    setTimeout(() => setCopiedSectionId(null), 2000);
  };

  // Copy complete rewritten content as clean Markdown/Text
  const handleCopyCompleteRewrite = () => {
    if (!activeRewrite) return;

    let output = `# ${activeRewrite.targetRole} - Optimized Resume Draft\n\n`;

    if (activeRewrite.professionalSummary?.improvedSummary) {
      output += `## Professional Summary\n${activeRewrite.professionalSummary.improvedSummary}\n\n`;
    }

    if (activeRewrite.improvedSkillsPresentation?.categorizedSkills?.length > 0) {
      output += `## Technical Skills\n`;
      activeRewrite.improvedSkillsPresentation.categorizedSkills.forEach((cat) => {
        output += `* **${cat.category}:** ${cat.skills.join(', ')}\n`;
      });
      output += `\n`;
    }

    if (activeRewrite.improvedProjects?.length > 0) {
      output += `## Technical Projects\n`;
      activeRewrite.improvedProjects.forEach((proj) => {
        output += `### ${proj.improvedTitle || proj.originalTitle}\n`;
        if (proj.skillsUsed?.length > 0) {
          output += `*Technologies: ${proj.skillsUsed.join(', ')}*\n`;
        }
        proj.improvedPoints?.forEach((pt) => {
          output += `* ${pt}\n`;
        });
        output += `\n`;
      });
    }

    if (activeRewrite.improvedExperience?.length > 0) {
      output += `## Experience\n`;
      activeRewrite.improvedExperience.forEach((exp) => {
        output += `### ${exp.improvedRole || exp.originalRole} - ${exp.originalCompany}\n`;
        exp.improvedPoints?.forEach((pt) => {
          output += `* ${pt}\n`;
        });
        output += `\n`;
      });
    }

    if (activeRewrite.suggestionsForMissingInfo?.length > 0) {
      output += `## Actionable Strengthening Suggestions\n`;
      activeRewrite.suggestionsForMissingInfo.forEach((sugg) => {
        output += `* ${sugg}\n`;
      });
      output += `\n`;
    }

    output += `\n---\n*Verified strictly against uploaded resume facts via Google Gemini AI on SkillBridge.*`;

    navigator.clipboard.writeText(output);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // Fetch single resume from backend with full extracted text for modal preview
  const handleViewExtractedText = async (resumeSummary) => {
    setLoadingTextId(resumeSummary._id);
    setFetchTextError('');
    setCopiedModalText(false);

    try {
      const res = await apiService.resume.getById(resumeSummary._id);
      if (res?.success && res.resume) {
        if (!res.resume.extractedText || res.resume.extractedText.trim().length === 0) {
          setFetchTextError(
            `No readable text was extracted for "${resumeSummary.originalFilename}". The file may be scanned or empty.`
          );
        } else {
          setPreviewResume(res.resume);
        }
      } else {
        setFetchTextError('Unable to retrieve resume data from the server.');
      }
    } catch (err) {
      setFetchTextError(err.message || 'Failed to fetch extracted text from backend.');
    } finally {
      setLoadingTextId(null);
    }
  };

  // Copy extracted plain text in modal to clipboard
  const handleCopyModalText = () => {
    if (previewResume?.extractedText) {
      navigator.clipboard.writeText(previewResume.extractedText);
      setCopiedModalText(true);
      setTimeout(() => setCopiedModalText(false), 2000);
    }
  };

  // Filter missing skills by search query and frequency tier
  const filteredMissingSkills = useMemo(() => {
    if (!activeAnalysis?.missingSkills) return [];
    return activeAnalysis.missingSkills.filter((item) => {
      const matchesSearch =
        !missingSearchTerm.trim() ||
        item.skill.toLowerCase().includes(missingSearchTerm.toLowerCase().trim());

      let matchesTier = true;
      if (missingTierFilter === 'high') {
        matchesTier = item.percentage >= 30;
      } else if (missingTierFilter === 'moderate') {
        matchesTier = item.percentage >= 15 && item.percentage < 30;
      } else if (missingTierFilter === 'specialized') {
        matchesTier = item.percentage < 15;
      }

      return matchesSearch && matchesTier;
    });
  }, [activeAnalysis, missingSearchTerm, missingTierFilter]);

  // Compute dynamic category scores for Tab 2 (Competency Chart)
  const studentSkills = student?.skills || [];
  const getCategoryScore = (category) => {
    const relevantSkills = studentSkills.filter(
      (s) => s.category?.toLowerCase() === category.toLowerCase()
    );
    if (!relevantSkills.length) return 25;
    let score = 0;
    relevantSkills.forEach((s) => {
      if (s.level === 'Advanced') score += 30;
      else if (s.level === 'Intermediate') score += 20;
      else score += 10;
    });
    return Math.min(Math.max(score, 20), 95);
  };

  const chartData = [
    { category: 'Frontend', 'Your Score': getCategoryScore('Frontend'), 'Industry Benchmark': 85 },
    { category: 'Programming', 'Your Score': getCategoryScore('Programming'), 'Industry Benchmark': 80 },
    { category: 'Backend & APIs', 'Your Score': getCategoryScore('Backend'), 'Industry Benchmark': 75 },
    { category: 'Databases', 'Your Score': getCategoryScore('Database'), 'Industry Benchmark': 70 },
    { category: 'Tools & Other', 'Your Score': getCategoryScore('Other'), 'Industry Benchmark': 75 }
  ];

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. Header Banner & Target Role Selection                 */}
      {/* ======================================================== */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="purple">AI Skill Gap Diagnostic</Badge>
            <span className="text-xs text-slate-500 font-medium">
              Industry Job Posting Benchmark &amp; AI Rewrite
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Resume Analyzer &amp; AI Career Assistant
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Benchmark your resume against <strong className="text-slate-700">3,804 analyzed job postings</strong> from our
            Kaggle dataset, and leverage Google Gemini AI to refine phrasing without fabricating qualifications.
          </p>
        </div>

        {/* Global target role selector */}
        <div className="shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Target Career Track:
          </label>
          <select
            value={resumeTargetRole}
            onChange={(e) => {
              setResumeTargetRole(e.target.value);
              setSelectedRole(e.target.value);
            }}
            className="text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {availableRoles.length > 0
              ? availableRoles.map((r) => (
                  <option key={r.roleSlug || r.role} value={r.role}>
                    {r.role} ({r.totalPostings} postings)
                  </option>
                ))
              : CAREER_GOALS_LIST.map((r) => (
                  <option key={r.id} value={r.title}>
                    {r.title}
                  </option>
                ))}
          </select>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. Primary Navigation Tabs                               */}
      {/* ======================================================== */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
        <button
          type="button"
          onClick={() => {
            setActiveTab('resume');
            setSearchParams({ tab: 'resume', role: resumeTargetRole, subview: resumeSubView });
          }}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'resume'
              ? 'border-brand-600 text-brand-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Resume Analyzer Hub</span>
          {uploadedResumes.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-brand-100 text-brand-700 font-bold rounded-full">
              {uploadedResumes.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('comparison');
            setSearchParams({ tab: 'comparison', role: resumeTargetRole });
          }}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'comparison'
              ? 'border-brand-600 text-brand-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
          }`}
        >
          <GitCompare className="w-4 h-4" />
          <span>Competency Diagnostic Chart</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 3. TAB 1: RESUME ANALYZER HUB                            */}
      {/* ======================================================== */}
      {activeTab === 'resume' && (
        <div className="space-y-6">
          {/* Guest / Demo Notice if unauthenticated */}
          {!isAuthenticated && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>You are viewing SkillBridge in Demo Mode.</strong>
                  <p className="mt-0.5 text-amber-800">
                    To upload, parse, benchmark, and rewrite your resume using Google Gemini AI, please sign in.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to="/login"
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-lg font-semibold text-xs transition-colors"
                >
                  Register
                </Link>
              </div>
            </div>
          )}

          {/* Section A: Upload Resume Form */}
          <Card
            title="Upload Student Resume"
            subtitle="Accepted formats: PDF (.pdf) and Microsoft Word (.docx) • Max size: 5 MB • Automatically parses text and technical skills"
          >
            <form onSubmit={handleUploadResume} className="space-y-4 text-xs pt-1">
              {uploadError && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Target Career Goal for This Resume
                  </label>
                  <select
                    value={resumeTargetRole}
                    onChange={(e) => setResumeTargetRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    {availableRoles.length > 0
                      ? availableRoles.map((r) => (
                          <option key={r.roleSlug || r.role} value={r.role}>
                            {r.role} ({r.totalPostings} postings)
                          </option>
                        ))
                      : CAREER_GOALS_LIST.map((r) => (
                          <option key={r.id} value={r.title}>
                            {r.title}
                          </option>
                        ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Your resume will be benchmarked and rewritten for this career track.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Select Resume File (PDF or DOCX)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer border border-slate-300 rounded-lg bg-white"
                  />
                  {selectedFile && (
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                      <span className="font-medium truncate max-w-xs">{selectedFile.name}</span>
                      <span className="text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  icon={Upload}
                  disabled={uploading || !selectedFile}
                >
                  {uploading ? 'Extracting Text & Saving to MongoDB...' : 'Upload & Process Resume'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Section B: Resume Selector Hub */}
          {uploadedResumes.length > 0 && (
            <Card
              title="Resume Selection & Actions Hub"
              subtitle="Select your resume to inspect extracted text, run skill-gap diagnostics, or generate Gemini AI rewrites"
              action={
                <button
                  type="button"
                  onClick={fetchResumes}
                  className="text-xs text-brand-600 hover:underline font-semibold flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Resumes</span>
                </button>
              }
            >
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-brand-600 shrink-0" />
                    <div>
                      <span className="text-[11px] text-slate-500 block font-medium uppercase tracking-wider">
                        Active Resume:
                      </span>
                      <select
                        value={selectedResume?._id || ''}
                        onChange={(e) => setSelectedResumeId(e.target.value)}
                        className="text-xs sm:text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 mt-0.5"
                      >
                        {uploadedResumes.map((r) => (
                          <option key={r._id} value={r._id}>
                            {r.originalFilename} ({r.targetRole}) — {new Date(r.createdAt).toLocaleDateString()}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedResume && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon={Eye}
                        onClick={() => handleViewExtractedText(selectedResume)}
                        disabled={loadingTextId === selectedResume._id}
                      >
                        {loadingTextId === selectedResume._id ? 'Loading...' : 'View Extracted Text'}
                      </Button>

                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        icon={RefreshCw}
                        onClick={handleAnalyzeGap}
                        disabled={analyzing}
                      >
                        {analyzing ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Comparing...</span>
                          </>
                        ) : activeAnalysis ? (
                          'Re-analyze Gap'
                        ) : (
                          'Analyze Skill Gap'
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="accent"
                        size="sm"
                        icon={Wand2}
                        onClick={() => {
                          setResumeSubView('rewrite');
                          if (!activeRewrite) handleGenerateRewrite();
                        }}
                        disabled={rewriting}
                      >
                        {rewriting ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Rewriting...</span>
                          </>
                        ) : activeRewrite ? (
                          'View AI Rewrite ✨'
                        ) : (
                          'Generate Rewrite ✨'
                        )}
                      </Button>

                      <button
                        type="button"
                        onClick={() => handleDeleteResume(selectedResume._id, selectedResume.originalFilename)}
                        disabled={deletingId === selectedResume._id}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete this resume"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {selectedResume && (
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 px-1">
                    <span>
                      File: <strong className="text-slate-800">{selectedResume.originalFilename}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Target Role: <strong className="text-slate-800">{resumeTargetRole || selectedResume.targetRole}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Extracted Words: <strong className="text-slate-800">{selectedResume.wordCount || 0}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Identified Skills: <strong className="text-brand-700">{selectedResume.extractedSkills?.length || 0}</strong>
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Section C: Resume Analyzer Sub-Navigation (Overview | Skill Gap | Rewrite) */}
          {selectedResume && (
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setResumeSubView('overview');
                  setSearchParams({ tab: 'resume', role: resumeTargetRole, subview: 'overview' });
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  resumeSubView === 'overview'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-brand-600" />
                <span>Overview</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setResumeSubView('gap');
                  setSearchParams({ tab: 'resume', role: resumeTargetRole, subview: 'gap' });
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  resumeSubView === 'gap'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Skill Gap Breakdown</span>
                {activeAnalysis && (
                  <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold">
                    {activeAnalysis.matchedSkills?.length || 0}/{activeAnalysis.totalPostings ? '51' : ''}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setResumeSubView('rewrite');
                  setSearchParams({ tab: 'resume', role: resumeTargetRole, subview: 'rewrite' });
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  resumeSubView === 'rewrite'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                <span>AI Resume Rewrite ✨</span>
                {activeRewrite && (
                  <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                )}
              </button>
            </div>
          )}

          {/* ======================================================== */}
          {/* SUB-VIEW 1: OVERVIEW SECTION                             */}
          {/* ======================================================== */}
          {resumeSubView === 'overview' && (
            <div className="space-y-6">
              {analyzing ? (
                <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-3 shadow-xs">
                  <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
                  <h3 className="text-base font-bold text-slate-900">Comparing Resume with Job Posting Data</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Benchmarking your resume against verified industry skill frequencies for{' '}
                    <strong className="text-slate-800">{resumeTargetRole}</strong> in MongoDB...
                  </p>
                </div>
              ) : activeAnalysis ? (
                <div className="space-y-6">
                  {/* Overview Hero Banner */}
                  <div className="bg-gradient-to-br from-slate-900 via-brand-navy to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="blue" size="xs">
                            Verified Analysis
                          </Badge>
                          <span className="text-xs text-slate-300">
                            File: {selectedResume?.originalFilename || 'Uploaded Resume'}
                          </span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                          {activeAnalysis.role}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                          Benchmarked against{' '}
                          <strong className="text-white">{activeAnalysis.totalPostings?.toLocaleString()}</strong> analyzed job
                          postings from the{' '}
                          <span className="text-brand-300 font-medium">{activeAnalysis.datasetSource}</span>.
                        </p>
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                        <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-center min-w-[120px]">
                          <span className="text-[10px] uppercase tracking-wider text-slate-300 block font-medium">
                            Analyzed Postings
                          </span>
                          <span className="text-xl sm:text-2xl font-bold text-white">
                            {activeAnalysis.totalPostings?.toLocaleString() || '...'}
                          </span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-center min-w-[120px]">
                          <span className="text-[10px] uppercase tracking-wider text-slate-300 block font-medium">
                            Industry Skills
                          </span>
                          <span className="text-xl sm:text-2xl font-bold text-brand-300">
                            {activeAnalysis.summary?.totalIndustrySkills ||
                              activeAnalysis.matchedSkills?.length + activeAnalysis.missingSkills?.length ||
                              '...'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span>
                        Analysis Date:{' '}
                        {activeAnalysis.analyzedAt
                          ? new Date(activeAnalysis.analyzedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Just now'}
                      </span>
                      <span>Persisted in MongoDB skillbridge database</span>
                    </div>
                  </div>

                  {/* Three Category Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* 1. Matched */}
                    <Card className="border-emerald-200/80 bg-gradient-to-b from-emerald-50/40 to-white shadow-xs">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                            Matched Skills
                          </span>
                          <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                            {activeAnalysis.matchedSkills?.length || 0}
                          </span>
                        </div>
                        <div className="text-2xl font-black text-emerald-950">
                          {activeAnalysis.matchedSkills?.length || 0}{' '}
                          <span className="text-xs font-semibold text-emerald-700">Skills Detected</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed pt-1">
                          Skills detected in your resume that are mentioned in the selected role's job postings.
                        </p>
                      </div>
                    </Card>

                    {/* 2. Missing */}
                    <Card className="border-amber-200/80 bg-gradient-to-b from-amber-50/40 to-white shadow-xs">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                            Missing Skills
                          </span>
                          <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                            {activeAnalysis.missingSkills?.length || 0}
                          </span>
                        </div>
                        <div className="text-2xl font-black text-amber-950">
                          {activeAnalysis.missingSkills?.length || 0}{' '}
                          <span className="text-xs font-semibold text-amber-700">Skills to Target</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed pt-1">
                          Industry skills frequently mentioned in job postings that were not detected in your uploaded resume.
                        </p>
                      </div>
                    </Card>

                    {/* 3. Resume-Only */}
                    <Card className="border-indigo-200/80 bg-gradient-to-b from-indigo-50/40 to-white shadow-xs">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
                            Resume-Only Skills
                          </span>
                          <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                            {activeAnalysis.resumeOnlySkills?.length || 0}
                          </span>
                        </div>
                        <div className="text-2xl font-black text-indigo-950">
                          {activeAnalysis.resumeOnlySkills?.length || 0}{' '}
                          <span className="text-xs font-semibold text-indigo-700">Supplementary Skills</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed pt-1">
                          Skills detected on your resume that do not appear in this role's analyzed profile. These represent valuable differentiation.
                        </p>
                      </div>
                    </Card>
                  </div>

                  {/* Mandatory Advisory Disclaimer Banner */}
                  <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-xs text-amber-950 leading-relaxed shadow-xs">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-amber-900 text-sm">Data Interpretation Advisory</h4>
                      <p>
                        Industry mention percentages represent the frequency of skills found in the analysed job descriptions
                        ({activeAnalysis.totalPostings?.toLocaleString()} postings from the {activeAnalysis.datasetSource}).
                        They are <strong className="underline">not</strong> mandatory prerequisites. Missing skills indicate
                        that a skill was not detected in the uploaded resume, not that the student cannot perform that skill.
                        Matched skills indicate resume mentions, not independently verified proficiency.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-3 shadow-xs">
                  <Sparkles className="w-10 h-10 text-brand-500 mx-auto" />
                  <h3 className="text-base font-bold text-slate-900">
                    Ready to Benchmark with {resumeTargetRole}?
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Click <strong>"Analyze Skill Gap"</strong> to compare skills from{' '}
                    <strong className="text-slate-800">{selectedResume?.originalFilename}</strong> against authentic job postings.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    icon={RefreshCw}
                    onClick={handleAnalyzeGap}
                    disabled={analyzing}
                  >
                    Analyze Skill Gap
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* SUB-VIEW 2: SKILL GAP BREAKDOWN SECTION                  */}
          {/* ======================================================== */}
          {resumeSubView === 'gap' && (
            <div className="space-y-6">
              {activeAnalysis ? (
                <div className="space-y-6">
                  {/* Group A: Matched Skills */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2 px-1">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500" />
                        <h3 className="text-base font-bold text-slate-900">
                          A. Matched Skills ({activeAnalysis.matchedSkills?.length || 0})
                        </h3>
                      </div>
                      <span className="text-xs text-slate-500">
                        Detected on resume &amp; present in {activeAnalysis.role} job postings
                      </span>
                    </div>

                    {activeAnalysis.matchedSkills?.length === 0 ? (
                      <div className="p-6 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                        No matching technical skills were detected for {activeAnalysis.role}.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {activeAnalysis.matchedSkills.map((item, idx) => {
                          const percentage = Number(item.percentage) || 0;
                          const mentionCount = Number(item.mentionCount) || 0;

                          return (
                            <div
                              key={item.skill || idx}
                              className="bg-white rounded-xl border border-emerald-200/80 p-4 shadow-xs flex flex-col justify-between gap-2.5 hover:border-emerald-300 transition-all"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-400 w-5">#{idx + 1}</span>
                                    <h4 className="text-sm font-bold text-slate-900">{item.skill}</h4>
                                  </div>
                                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {percentage.toFixed(1)}% Frequency
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                                  <span>
                                    Mentioned in <strong className="text-slate-800">{mentionCount}</strong> of{' '}
                                    {activeAnalysis.totalPostings} job postings
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                                    <Check className="w-3.5 h-3.5" /> Matched
                                  </span>
                                </div>

                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="h-2 rounded-full bg-emerald-600 transition-all duration-500"
                                    style={{ width: `${Math.min(100, Math.max(2, percentage))}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Group B: Missing Skills */}
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-500" />
                        <h3 className="text-base font-bold text-slate-900">
                          B. Missing Skills ({activeAnalysis.missingSkills?.length || 0})
                        </h3>
                      </div>
                      <span className="text-xs text-slate-500">
                        In demand for {activeAnalysis.role}, but not detected in your resume
                      </span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between text-xs">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search missing skills (e.g. SQL, TypeScript, AWS)..."
                          value={missingSearchTerm}
                          onChange={(e) => setMissingSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-8 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50 focus:bg-white"
                        />
                        {missingSearchTerm && (
                          <button
                            onClick={() => setMissingSearchTerm('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                        <span className="text-slate-500 font-medium text-[11px] whitespace-nowrap mr-1">
                          Tier:
                        </span>
                        {[
                          { id: 'all', label: `All (${activeAnalysis.missingSkills?.length || 0})` },
                          {
                            id: 'high',
                            label: `High ≥30% (${
                              activeAnalysis.missingSkills?.filter((s) => s.percentage >= 30).length || 0
                            })`
                          },
                          {
                            id: 'moderate',
                            label: `Moderate 15-29% (${
                              activeAnalysis.missingSkills?.filter((s) => s.percentage >= 15 && s.percentage < 30).length || 0
                            })`
                          },
                          {
                            id: 'specialized',
                            label: `Specialized <15% (${
                              activeAnalysis.missingSkills?.filter((s) => s.percentage < 15).length || 0
                            })`
                          }
                        ].map((tier) => (
                          <button
                            key={tier.id}
                            onClick={() => setMissingTierFilter(tier.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                              missingTierFilter === tier.id
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {tier.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {filteredMissingSkills.length === 0 ? (
                      <div className="p-6 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                        No missing skills matched "{missingSearchTerm}".
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {filteredMissingSkills.map((item, idx) => {
                          const percentage = Number(item.percentage) || 0;
                          const mentionCount = Number(item.mentionCount) || 0;

                          let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                          let barClass = 'bg-slate-500';

                          if (percentage >= 30) {
                            badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
                            barClass = 'bg-amber-600';
                          } else if (percentage >= 15) {
                            badgeClass = 'bg-blue-50 text-blue-800 border-blue-200';
                            barClass = 'bg-brand-600';
                          }

                          return (
                            <div
                              key={item.skill || idx}
                              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between gap-2.5 hover:border-slate-300 transition-all"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-400 w-5">#{idx + 1}</span>
                                    <h4 className="text-sm font-bold text-slate-900">{item.skill}</h4>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                                    {item.frequencyCategory || (percentage >= 30 ? 'High Frequency' : 'Specialized')}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                                  <span>
                                    Mentioned in <strong className="text-slate-800">{mentionCount}</strong> of{' '}
                                    {activeAnalysis.totalPostings} postings ({percentage.toFixed(1)}%)
                                  </span>
                                  <span className="text-[11px] font-medium text-amber-700">Not Detected</span>
                                </div>

                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-500 ${barClass}`}
                                    style={{ width: `${Math.min(100, Math.max(2, percentage))}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Group C: Resume-Only Skills */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between flex-wrap gap-2 px-1">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-indigo-500" />
                        <h3 className="text-base font-bold text-slate-900">
                          C. Resume-Only Skills ({activeAnalysis.resumeOnlySkills?.length || 0})
                        </h3>
                      </div>
                      <span className="text-xs text-slate-500">
                        Additional capabilities detected on your resume
                      </span>
                    </div>

                    {activeAnalysis.resumeOnlySkills?.length === 0 ? (
                      <div className="p-6 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                        All detected skills on your resume aligned with the primary {activeAnalysis.role} profile.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {activeAnalysis.resumeOnlySkills.map((item, idx) => (
                          <div
                            key={item.skill || idx}
                            className="bg-white rounded-xl border border-indigo-200/80 p-4 shadow-xs flex flex-col justify-between gap-2 hover:border-indigo-300 transition-all"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-bold text-slate-900">{item.skill}</h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Supplementary Skill
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {item.explanation ||
                                'Detected in your resume, but not frequently mentioned in the analyzed job postings for this role. These are valuable supplementary skills that can differentiate your candidate profile.'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-3 shadow-xs">
                  <GitCompare className="w-10 h-10 text-brand-500 mx-auto" />
                  <h3 className="text-base font-bold text-slate-900">No Skill Gap Analysis Yet</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Run the skill-gap diagnostic to see how your technical skills match industry job descriptions.
                  </p>
                  <Button type="button" variant="primary" size="md" onClick={handleAnalyzeGap}>
                    Analyze Skill Gap
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* SUB-VIEW 3: AI RESUME REWRITE SECTION (NEW FEATURE)      */}
          {/* ======================================================== */}
          {resumeSubView === 'rewrite' && (
            <div className="space-y-6">
              {/* Role Mismatch Warning if targetRole changed */}
              {activeRewrite && activeRewrite.targetRole !== (resumeTargetRole || selectedResume?.targetRole) && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Target Role Discrepancy:</strong>
                      <p className="mt-0.5 text-amber-800">
                        This rewrite was generated for <strong>{activeRewrite.targetRole}</strong>, but you are currently
                        targeting <strong>{resumeTargetRole || selectedResume?.targetRole}</strong>.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    icon={RefreshCw}
                    onClick={handleGenerateRewrite}
                    disabled={rewriting}
                  >
                    Regenerate for {resumeTargetRole}
                  </Button>
                </div>
              )}

              {/* Gemini API Key Configuration Missing Alert */}
              {rewriteErrorCode === 'CONFIG_MISSING' && (
                <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-300 rounded-2xl shadow-xs space-y-3">
                  <div className="flex items-start gap-3">
                    <KeyRound className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-amber-950">
                        Google Gemini API Configuration Required
                      </h4>
                      <p className="text-xs text-amber-900 leading-relaxed">
                        The AI Resume Rewrite engine uses Google's official Gemini API. To generate authentic rewrites, please configure your API key in the backend environment:
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-xs overflow-x-auto select-all">
                    GEMINI_API_KEY=your_gemini_api_key_here<br />
                    GEMINI_MODEL=gemini-2.5-flash
                  </div>

                  <div className="flex items-center justify-between text-xs text-amber-800 pt-1">
                    <span>File location: <code className="bg-amber-100 px-1.5 py-0.5 rounded">backend/.env</code></span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={RefreshCw}
                      onClick={handleGenerateRewrite}
                    >
                      Retry Connection
                    </Button>
                  </div>
                </div>
              )}

              {/* General Rewrite Error Alert */}
              {rewriteError && rewriteErrorCode !== 'CONFIG_MISSING' && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-rose-900">Rewrite Generation Error</h4>
                      <p className="mt-0.5 text-rose-700">{rewriteError}</p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={RefreshCw}
                    onClick={handleGenerateRewrite}
                    className="shrink-0 border-rose-300 text-rose-800 hover:bg-rose-100"
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Rewriting Loading State */}
              {rewriting && (
                <div className="p-10 bg-white border border-slate-200 rounded-2xl text-center space-y-4 shadow-sm">
                  <div className="relative w-12 h-12 mx-auto">
                    <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
                    <Wand2 className="w-5 h-5 text-purple-600 absolute inset-0 m-auto" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Generating AI Rewrite with Google Gemini...
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                      Analyzing existing projects, refining action verbs, and organizing skills for{' '}
                      <strong className="text-slate-800">{resumeTargetRole}</strong> while strictly enforcing zero factual fabrication.
                    </p>
                  </div>
                </div>
              )}

              {/* Prompt to generate if no rewrite yet */}
              {!rewriting && !activeRewrite && (
                <div className="p-8 bg-gradient-to-b from-purple-50/40 to-white border border-purple-200/80 rounded-2xl text-center space-y-4 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-xs">
                    <Wand2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Transform Resume Content with Gemini AI
                    </h3>
                    <p className="text-xs text-slate-600 max-w-lg mx-auto mt-1 leading-relaxed">
                      Enhance the professional tone, bullet points, and ATS readability of your existing projects and skills
                      for <strong className="text-slate-900">{resumeTargetRole}</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-purple-200 max-w-md mx-auto text-[11px] text-slate-600 text-left space-y-1.5 shadow-2xs">
                    <span className="font-bold text-purple-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Strict Anti-Fabrication Guarantee:
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                      <li>Uses only facts present in your uploaded resume</li>
                      <li>Never invents jobs, projects, metrics, or credentials</li>
                      <li>Never claims skills you haven't performed</li>
                    </ul>
                  </div>

                  <Button
                    type="button"
                    variant="accent"
                    size="md"
                    icon={Wand2}
                    onClick={handleGenerateRewrite}
                    disabled={rewriting}
                  >
                    Generate AI Rewrite for {resumeTargetRole}
                  </Button>
                </div>
              )}

              {/* Active Rewrite Content Display */}
              {!rewriting && activeRewrite && (
                <div className="space-y-6">
                  {/* Hero Rewrite Bar */}
                  <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="purple" size="xs">
                          Gemini AI Rewrite
                        </Badge>
                        <span className="text-xs text-purple-200">
                          Target: <strong>{activeRewrite.targetRole}</strong>
                        </span>
                      </div>
                      <h3 className="text-lg font-extrabold text-white">AI-Optimized Resume Draft</h3>
                      <p className="text-xs text-purple-200">
                        Generated on{' '}
                        {new Date(activeRewrite.generatedAt || Date.now()).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}{' '}
                        using <code className="bg-white/10 px-1 py-0.5 rounded text-[11px]">{activeRewrite.modelUsed || 'gemini-2.5-flash'}</code>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon={RefreshCw}
                        onClick={handleGenerateRewrite}
                        disabled={rewriting}
                        className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                      >
                        Regenerate
                      </Button>

                      <Button
                        type="button"
                        variant="accent"
                        size="sm"
                        icon={Copy}
                        onClick={handleCopyCompleteRewrite}
                      >
                        {copiedAll ? 'Copied Full Resume!' : 'Copy Complete Rewrite'}
                      </Button>
                    </div>
                  </div>

                  {/* 1. Professional Summary Card */}
                  <Card
                    title="1. Professional Summary"
                    subtitle="Concise positioning statement tailored to your target engineering track"
                    action={
                      activeRewrite.professionalSummary?.improvedSummary && (
                        <button
                          type="button"
                          onClick={() =>
                            handleCopySection(activeRewrite.professionalSummary.improvedSummary, 'summary')
                          }
                          className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedSectionId === 'summary' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Summary</span>
                            </>
                          )}
                        </button>
                      )
                    }
                  >
                    {activeRewrite.professionalSummary?.hasOriginalSummary &&
                    activeRewrite.professionalSummary?.improvedSummary ? (
                      <div className="space-y-3 pt-1">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
                          {activeRewrite.professionalSummary.improvedSummary}
                        </div>
                        {activeRewrite.professionalSummary.summaryNotes && (
                          <p className="text-[11px] text-slate-500 italic">
                            Tip: {activeRewrite.professionalSummary.summaryNotes}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
                        <p className="font-semibold text-slate-800 mb-1">
                          No professional summary detected in original resume.
                        </p>
                        <p className="text-slate-500">
                          In accordance with non-fabrication rules, a summary was not synthesized. For an engineering
                          student resume targeting {activeRewrite.targetRole}, you can optionally add a 2-sentence summary
                          summarizing your degree year, primary core skills, and internship aspirations.
                        </p>
                      </div>
                    )}
                  </Card>

                  {/* 2. Technical Projects Card */}
                  <Card
                    title={`2. Technical Projects (${activeRewrite.improvedProjects?.length || 0})`}
                    subtitle="Enhanced with high-impact technical action verbs while preserving authentic project scope"
                  >
                    {activeRewrite.improvedProjects?.length === 0 ? (
                      <div className="p-4 text-xs text-slate-500 text-center">
                        No technical projects identified in the resume text.
                      </div>
                    ) : (
                      <div className="space-y-4 pt-1">
                        {activeRewrite.improvedProjects.map((proj, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl border border-slate-200 hover:border-brand-200 transition-colors bg-white shadow-2xs space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                              <div>
                                <h4 className="text-sm font-bold text-slate-900">
                                  {proj.improvedTitle || proj.originalTitle}
                                </h4>
                                {proj.skillsUsed?.length > 0 && (
                                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                    {proj.skillsUsed.map((sk) => (
                                      <span
                                        key={sk}
                                        className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-100"
                                      >
                                        {sk}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const textToCopy = `${proj.improvedTitle || proj.originalTitle}\n${proj.improvedPoints?.map((p) => `• ${p}`).join('\n')}`;
                                  handleCopySection(textToCopy, `proj-${idx}`);
                                }}
                                className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1 shrink-0"
                              >
                                {copiedSectionId === `proj-${idx}` ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-700">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy Project</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Improved bullet points */}
                            <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
                              {proj.improvedPoints?.map((pt, pIdx) => (
                                <li key={pIdx} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0 mt-1.5" />
                                  <span>{pt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* 3. Work & Internship Experience Card */}
                  <Card
                    title="3. Experience Descriptions"
                    subtitle="Polished role bullets highlighting technical responsibilities"
                  >
                    {activeRewrite.improvedExperience?.length === 0 ? (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
                        <p className="font-semibold text-slate-800 mb-1">
                          No prior formal work experience detected.
                        </p>
                        <p className="text-slate-500">
                          As an engineering student without prior formal internships, your hands-on technical projects,
                          hackathons, and open-source contributions take center stage for {activeRewrite.targetRole}.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 pt-1">
                        {activeRewrite.improvedExperience.map((exp, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                              <div>
                                <h4 className="text-sm font-bold text-slate-900">
                                  {exp.improvedRole || exp.originalRole}
                                </h4>
                                <p className="text-xs text-slate-500">{exp.originalCompany}</p>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const textToCopy = `${exp.improvedRole || exp.originalRole} - ${exp.originalCompany}\n${exp.improvedPoints?.map((p) => `• ${p}`).join('\n')}`;
                                  handleCopySection(textToCopy, `exp-${idx}`);
                                }}
                                className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1 shrink-0"
                              >
                                {copiedSectionId === `exp-${idx}` ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-700">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy Experience</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
                              {exp.improvedPoints?.map((pt, pIdx) => (
                                <li key={pIdx} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0 mt-1.5" />
                                  <span>{pt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* 4. Skills Presentation Card */}
                  <Card
                    title="4. Categorized Skills Presentation"
                    subtitle="Grouped by technology domain to maximize readability for applicant tracking systems (ATS)"
                    action={
                      <button
                        type="button"
                        onClick={() => {
                          const skillsText = activeRewrite.improvedSkillsPresentation?.categorizedSkills
                            ?.map((c) => `${c.category}: ${c.skills?.join(', ')}`)
                            .join('\n');
                          handleCopySection(skillsText, 'skills');
                        }}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                      >
                        {copiedSectionId === 'skills' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Skills</span>
                          </>
                        )}
                      </button>
                    }
                  >
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {activeRewrite.improvedSkillsPresentation?.categorizedSkills?.map((cat, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl space-y-1.5"
                          >
                            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                              {cat.category}
                            </h5>
                            <div className="flex flex-wrap gap-1.5">
                              {cat.skills?.map((sk) => (
                                <span
                                  key={sk}
                                  className="px-2 py-0.5 rounded-md bg-white text-slate-800 border border-slate-200 text-xs font-medium"
                                >
                                  {sk}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {activeRewrite.improvedSkillsPresentation?.presentationTips && (
                        <p className="text-[11px] text-slate-500 italic">
                          ATS Tip: {activeRewrite.improvedSkillsPresentation.presentationTips}
                        </p>
                      )}
                    </div>
                  </Card>

                  {/* 5. Suggestions for Information to Add */}
                  {activeRewrite.suggestionsForMissingInfo?.length > 0 && (
                    <Card
                      title="5. Actionable Suggestions to Strengthen Your Resume"
                      subtitle="Legitimate details and metrics you could provide to enhance candidate credibility"
                    >
                      <div className="space-y-2 pt-1 text-xs">
                        {activeRewrite.suggestionsForMissingInfo.map((sugg, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 flex items-start gap-2.5 text-purple-950"
                          >
                            <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{sugg}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Mandatory Verification Notice */}
                  <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl text-xs text-slate-600 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block font-semibold mb-0.5">
                        Student Verification Notice:
                      </strong>
                      <span>{activeRewrite.verificationWarning}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. TAB 2: COMPETENCY DIAGNOSTIC CHART (PRESERVED VIEW)   */}
      {/* ======================================================== */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card
                title="Category Competency Distribution"
                subtitle={`Self-reported skills benchmarked against standard junior expectations for ${selectedRole}`}
              >
                <div className="h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1E293B',
                          color: '#fff',
                          borderRadius: '8px',
                          fontSize: '12px',
                          border: 'none'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="Your Score" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={28} />
                      <Bar dataKey="Industry Benchmark" fill="#94A3B8" radius={[4, 4, 0, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <Card title="Diagnostic Recommendations" subtitle="Pacing suggestions based on self-reported profile">
              <div className="space-y-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="font-semibold text-slate-800 block">1. Build Portfolio Projects</span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Take skills marked as "Beginner" and build small end-to-end features rather than just watching video tutorials.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="font-semibold text-slate-800 block">2. Roadmap Milestones</span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Follow your {student?.semester || 'current semester'} roadmap timeline to pace your study.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="font-semibold text-slate-800 block">3. Run Resume Analyzer</span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Switch to the Resume Analyzer Hub to benchmark your resume and generate AI-enhanced rewrites.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. Extracted Text Modal (Preserved Preview Feature)       */}
      {/* ======================================================== */}
      {previewResume && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50/80">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-navy text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <FileText className="w-5 h-5 text-brand-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900">{previewResume.originalFilename}</h3>
                    <Badge variant="blue" size="xs">
                      {previewResume.fileType?.toUpperCase()}
                    </Badge>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Extracted Successfully</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                    <span>Target Role: <strong>{previewResume.targetRole}</strong></span>
                    <span>•</span>
                    <span>Word Count: <strong className="text-brand-700">{previewResume.wordCount || 0} words</strong></span>
                    <span>•</span>
                    <span>Uploaded: {new Date(previewResume.createdAt).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewResume(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-2 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between text-[11px] text-blue-900">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span>Text parsed natively from document buffer and retrieved from MongoDB. Paragraph spacing and line breaks preserved.</span>
              </span>
              <button
                type="button"
                onClick={handleCopyModalText}
                className="font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
              >
                {copiedModalText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/40">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs font-sans text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap select-text">
                {previewResume.extractedText || 'No readable text content found in this document.'}
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px] text-slate-400 truncate max-w-sm">
                Document ID: {previewResume._id}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyModalText}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                >
                  {copiedModalText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied to Clipboard</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy All Text</span>
                    </>
                  )}
                </button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setPreviewResume(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
