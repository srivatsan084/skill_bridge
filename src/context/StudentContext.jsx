import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

const StudentContext = createContext(null);

const DEMO_STORAGE_KEY = 'skillbridge_demo_student_profile';
const AUTH_MODE_KEY = 'skillbridge_auth_mode'; // 'authenticated' | 'demo'

// Standard baseline skills required for full role readiness estimation
export const ROLE_SKILL_BENCHMARKS = {
  'Frontend Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'Tailwind CSS', 'Git'],
  'Backend Developer': ['JavaScript', 'Node.js', 'Express.js', 'MongoDB', 'SQL', 'Git'],
  'Full Stack Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Express.js', 'MongoDB', 'Git'],
  'Software Developer': ['C++', 'Java', 'Data Structures', 'Problem Solving', 'Git', 'SQL'],
  'Data Analyst': ['Python', 'SQL', 'MySQL', 'Problem Solving'],
  'Data Scientist': ['Python', 'SQL', 'Data Structures', 'Problem Solving'],
  'AI/ML Engineer': ['Python', 'Data Structures', 'Problem Solving', 'C++'],
  'Cloud Engineer': ['Python', 'Node.js', 'Git', 'GitHub'],
  'DevOps Engineer': ['Git', 'GitHub', 'Python', 'Node.js'],
  'Cybersecurity Analyst': ['Python', 'C', 'Problem Solving', 'Git']
};

export const INITIAL_DEMO_STUDENT = {
  _id: 'demo-student-001',
  id: 'std-2024-042',
  isOnboarded: true,
  name: 'Aarav Sharma',
  email: 'aarav.sharma@college.edu',
  college: 'National Institute of Technology',
  degree: 'B.Tech in Computer Science & Engineering',
  branch: 'Computer Science & Engineering',
  academicYear: 'Second Year',
  semester: 'Semester 4',
  graduationYear: 2026,
  targetRole: 'Full Stack Developer',
  secondaryInterests: ['Backend Developer', 'DevOps Engineer'],
  skills: [
    { name: 'HTML', category: 'Frontend', level: 'Advanced' },
    { name: 'CSS', category: 'Frontend', level: 'Advanced' },
    { name: 'Tailwind CSS', category: 'Frontend', level: 'Intermediate' },
    { name: 'JavaScript', category: 'Programming', level: 'Intermediate' },
    { name: 'React', category: 'Frontend', level: 'Beginner' },
    { name: 'C++', category: 'Programming', level: 'Intermediate' },
    { name: 'Git', category: 'Other', level: 'Intermediate' },
    { name: 'Data Structures', category: 'Other', level: 'Intermediate' }
  ],
  learningPreferences: {
    formats: ['Video', 'Documentation'],
    hoursPerWeek: '5-10 hours / week (Recommended for college students)',
    language: 'English',
    preferFreeOnly: true
  },
  bio: 'Passionate CS sophomore looking to master full-stack web development and cloud fundamentals before junior year internships.',
  isDemoAccount: true,
  updatedAt: new Date().toISOString()
};

export function StudentProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dynamic readiness score calculator
  const calculateReadinessScore = useCallback((targetRole, skills = []) => {
    const benchmarkSkills =
      ROLE_SKILL_BENCHMARKS[targetRole] || ROLE_SKILL_BENCHMARKS['Full Stack Developer'];
    if (!skills || !skills.length || !benchmarkSkills.length) return 20;

    let totalWeight = 0;
    benchmarkSkills.forEach((reqSkill) => {
      const found = skills.find(
        (s) => s.name && s.name.toLowerCase() === reqSkill.toLowerCase()
      );
      if (found) {
        if (found.level === 'Advanced') totalWeight += 1;
        else if (found.level === 'Intermediate') totalWeight += 0.7;
        else totalWeight += 0.4;
      }
    });

    const percentage = Math.round((totalWeight / benchmarkSkills.length) * 100);
    return Math.min(Math.max(percentage, 15), 95);
  }, []);

  // Check authenticated session with backend on initial mount
  const checkAuthStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Try to fetch currently authenticated user from backend session
      const meData = await apiService.auth.getMe();
      if (meData?.success && meData?.student) {
        // Fetch full profile from MongoDB
        const profileData = await apiService.profile.get();
        const fullStudent = profileData?.student || meData.student;
        setStudent({ ...fullStudent, isDemoAccount: false });
        setIsAuthenticated(true);
        setIsDemoUser(false);
        localStorage.setItem(AUTH_MODE_KEY, 'authenticated');
        setLoading(false);
        return;
      }
    } catch {
      // Session not active or backend unreachable
    }

    // 2. Check if user was previously in demo mode
    const authMode = localStorage.getItem(AUTH_MODE_KEY);
    if (authMode === 'demo') {
      try {
        const stored = localStorage.getItem(DEMO_STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : INITIAL_DEMO_STUDENT;
        setStudent({ ...parsed, isDemoAccount: true });
        setIsDemoUser(true);
        setIsAuthenticated(false);
      } catch {
        setStudent({ ...INITIAL_DEMO_STUDENT, isDemoAccount: true });
        setIsDemoUser(true);
        setIsAuthenticated(false);
      }
    } else {
      // Default to demo mode for seamless initial browsing without blocking UI
      setStudent({ ...INITIAL_DEMO_STUDENT, isDemoAccount: true });
      setIsDemoUser(true);
      setIsAuthenticated(false);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Sync demo student modifications to localStorage
  useEffect(() => {
    if (isDemoUser && student) {
      try {
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(student));
      } catch (err) {
        console.error('Failed to save demo student profile:', err);
      }
    }
  }, [student, isDemoUser]);

  /**
   * Log in student with email and password via backend JWT HttpOnly cookie
   */
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.auth.login({ email, password });
      if (result.success && result.student) {
        const profileResult = await apiService.profile.get();
        const loadedStudent = profileResult?.student || result.student;
        setStudent({ ...loadedStudent, isDemoAccount: false });
        setIsAuthenticated(true);
        setIsDemoUser(false);
        localStorage.setItem(AUTH_MODE_KEY, 'authenticated');
        setLoading(false);
        return { success: true, student: loadedStudent };
      }
      throw new Error(result.message || 'Login failed');
    } catch (err) {
      setLoading(false);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Register new student in MongoDB
   */
  const register = async (registrationData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.auth.register(registrationData);
      if (result.success && result.student) {
        setStudent({ ...result.student, isDemoAccount: false });
        setIsAuthenticated(true);
        setIsDemoUser(false);
        localStorage.setItem(AUTH_MODE_KEY, 'authenticated');
        setLoading(false);
        return { success: true, student: result.student };
      }
      throw new Error(result.message || 'Registration failed');
    } catch (err) {
      setLoading(false);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Log out student and clear HttpOnly cookie
   */
  const logout = async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        await apiService.auth.logout();
      }
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      setIsAuthenticated(false);
      setIsDemoUser(true);
      localStorage.setItem(AUTH_MODE_KEY, 'demo');
      setStudent({ ...INITIAL_DEMO_STUDENT, isDemoAccount: true });
      setLoading(false);
    }
  };

  /**
   * Update student profile (persists to MongoDB if authenticated, or localStorage if demo)
   */
  const updateProfile = async (updatedFields) => {
    if (isAuthenticated) {
      try {
        const res = await apiService.profile.update(updatedFields);
        if (res.success && res.student) {
          setStudent({ ...res.student, isDemoAccount: false });
          return res.student;
        }
      } catch (err) {
        console.error('Failed to update profile on backend:', err);
        throw err;
      }
    } else {
      // Demo mode update
      setStudent((prev) => {
        const merged = {
          ...prev,
          ...updatedFields,
          updatedAt: new Date().toISOString()
        };
        return merged;
      });
      return student;
    }
  };

  /**
   * Complete onboarding and mark profile as active in MongoDB
   */
  const completeOnboarding = async (onboardingData) => {
    const payload = {
      ...onboardingData,
      isOnboarded: true
    };
    return updateProfile(payload);
  };

  /**
   * Switch into Demo student mode explicitly
   */
  const resetToDemo = () => {
    setIsAuthenticated(false);
    setIsDemoUser(true);
    localStorage.setItem(AUTH_MODE_KEY, 'demo');
    setStudent({ ...INITIAL_DEMO_STUDENT, isDemoAccount: true });
  };

  /**
   * Start a clean onboarding session
   */
  const startFreshOnboarding = () => {
    const blank = {
      id: `std-${Date.now().toString().slice(-5)}`,
      isOnboarded: false,
      name: '',
      email: '',
      college: '',
      degree: 'B.Tech',
      branch: 'Computer Science & Engineering',
      academicYear: 'First Year',
      semester: 'Semester 1',
      graduationYear: new Date().getFullYear() + 4,
      targetRole: 'Full Stack Developer',
      secondaryInterests: [],
      skills: [],
      learningPreferences: {
        formats: ['Video', 'Interactive'],
        hoursPerWeek: '5-10 hours / week (Recommended for college students)',
        language: 'English',
        preferFreeOnly: true
      },
      bio: '',
      isDemoAccount: !isAuthenticated,
      updatedAt: new Date().toISOString()
    };
    setStudent(blank);
  };

  const currentReadiness = calculateReadinessScore(student?.targetRole, student?.skills);

  return (
    <StudentContext.Provider
      value={{
        student,
        isAuthenticated,
        isDemoUser,
        loading,
        error,
        currentReadiness,
        login,
        register,
        logout,
        updateProfile,
        completeOnboarding,
        resetToDemo,
        startFreshOnboarding,
        checkAuthStatus
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}
