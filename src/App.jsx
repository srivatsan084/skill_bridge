import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StudentProvider } from './context/StudentContext';

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import StudentLayout from './components/layout/StudentLayout';

// Public Pages
import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import OnboardingPage from './pages/public/OnboardingPage';

// Student Portal Pages
import DashboardPage from './pages/student/DashboardPage';
import CareerExplorerPage from './pages/student/CareerExplorerPage';
import SkillGapPage from './pages/student/SkillGapPage';
import RoadmapPage from './pages/student/RoadmapPage';
import ResourcesPage from './pages/student/ResourcesPage';
import ProfilePage from './pages/student/ProfilePage';

export default function App() {
  return (
    <StudentProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Website Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Route>

          {/* Logged-In Student Application Portal */}
          <Route path="/app" element={<StudentLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="careers" element={<CareerExplorerPage />} />
            <Route path="skill-gap" element={<SkillGapPage />} />
            <Route path="roadmap" element={<RoadmapPage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StudentProvider>
  );
}
