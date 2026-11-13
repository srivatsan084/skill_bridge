# SkillBridge – AI-Powered Skill Gap & Career Recommendation Platform

> A student-focused career development platform designed for 1st, 2nd, and 3rd-year engineering students.

SkillBridge helps engineering students understand:
- **What to learn** (Target career role benchmarks)
- **Why to learn it** (Objective skill gap analysis vs industry requirements)
- **How to learn it** (Curated 100% free learning resources & semester-wise roadmap)

---

## 🛠️ Technology Stack

- **Framework**: React.js 18 with Vite
- **Language**: JavaScript (ES6+)
- **Styling**: Tailwind CSS v3.4.1 (Clean SaaS aesthetic, deep navy primary `#0B1528`, responsive layout)
- **Routing**: React Router DOM v6
- **State Management**: React Context API (`StudentContext`) with browser `localStorage` persistence
- **Icons**: Lucide React
- **Data Visualization**: Recharts (Dynamic skill gap comparison chart)

---

## 📁 Directory Structure

```text
src/
├── assets/                     # Static graphics and icons
├── components/
│   ├── common/                 # Reusable UI building blocks
│   │   ├── Badge.jsx           # Status & category pills
│   │   ├── Button.jsx          # Reusable button with Lucide icon support
│   │   ├── Card.jsx            # SaaS card container
│   │   ├── Footer.jsx          # Public footer with disclaimer
│   │   ├── Navbar.jsx          # Public responsive navigation
│   │   ├── Sidebar.jsx         # Dynamic student portal sidebar with goal & readiness
│   │   └── TopNav.jsx          # Student portal top bar with dynamic name & semester
│   ├── dashboard/              # Modular student dashboard components
│   │   ├── AcademicInfoCard.jsx      # Student institution, year & semester
│   │   ├── CareerGoalCard.jsx        # Target career role & secondary interests
│   │   ├── LearningPreferencesCard.jsx # Hours/week, formats & free resource filter
│   │   ├── NextActivityCard.jsx      # Priority next study task
│   │   ├── ProgressCard.jsx          # Computed readiness gauge vs role benchmark
│   │   ├── RoadmapPreviewCard.jsx    # Semester milestone checklist
│   │   └── SkillBreakdownCard.jsx    # Acquired skills & missing role gaps
│   └── layout/
│       ├── PublicLayout.jsx    # Wrapper for public pages (Nav + Main + Footer)
│       └── StudentLayout.jsx   # Wrapper for student portal (Sidebar + TopNav + Main)
├── context/
│   └── StudentContext.jsx      # Central profile state management & localStorage sync
├── data/
│   ├── demoData.js             # Initial sample engineering dataset & reference roles
│   └── onboardingData.js       # Predefined skills, career tracks & academic options
├── pages/
│   ├── public/                 # Public marketing, auth & onboarding pages
│   │   ├── AboutPage.jsx       # Vision, problem statement & references
│   │   ├── HomePage.jsx        # Hero, 3-step flow, objectives & benefits
│   │   ├── LoginPage.jsx       # Student login with demo reset & onboarding launchers
│   │   ├── OnboardingPage.jsx  # 5-step guided onboarding wizard
│   │   └── RegisterPage.jsx    # Onboarding entry form
│   └── student/                # Protected student workspace
│       ├── CareerExplorerPage.jsx  # Tech tracks & skill benchmarks
│       ├── DashboardPage.jsx       # Academic summary, progress & preferences
│       ├── ProfilePage.jsx         # 4-tab profile editor with skill & preference management
│       ├── ResourcesPage.jsx       # Curated 100% free courses & docs
│       ├── RoadmapPage.jsx         # Semester-wise milestones & checklist
│       └── SkillGapPage.jsx        # Dynamic comparative chart & gap diagnosis
├── services/
│   └── api.js                  # API service layer (ready for Phase 2 backend)
├── utils/
│   └── helpers.js              # Formatting and helper utilities
├── App.jsx                     # Central route architecture & StudentProvider
├── index.css                   # Tailwind CSS base styles & scrollbar
└── main.jsx                    # Application entry point
```

---

## 🚀 How to Run the Project

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

3. **Build for production**:
   ```bash
   npm run build
   ```

---

## 🧪 Testing the Student Onboarding Flow

1. Open the website at `http://localhost:3000`.
2. Click **"Get Started"** or visit `/register` or `/onboarding`.
3. Complete the 5 steps:
   - **Step 1: Basic Information**: Select an Academic Year (notice how the Semester dropdown automatically updates to match the year).
   - **Step 2: Career Interests**: Click a role card (e.g. "Full Stack Developer") as your primary goal, and optionally add secondary interests.
   - **Step 3: Technical Skills**: Click predefined category skills (C, C++, React, Git, etc.) or type any custom skill (e.g., Docker, Flutter). Select your self-assessed level (`Beginner`, `Intermediate`, `Advanced`).
   - **Step 4: Learning Preferences**: Select preferred formats (Video, Docs, Interactive), weekly hours, language, and the 100% free resources toggle.
   - **Step 5: Review & Confirmation**: Review all information. Click "Complete My Profile".
4. You are redirected to the **Dashboard**, where:
   - Academic info, career track, and readiness score reflect your choices.
   - The TopNav displays your name and semester.
   - The Sidebar displays your target goal and readiness percentage.
   - The Learning Preferences card displays your study schedule.
5. Visit **My Profile** (`/app/profile`) to edit any basic info, add/remove skills, change self-assessed levels, or restart the onboarding wizard.
6. Refresh the page: All profile information persists in browser `localStorage` under `skillbridge_student_profile`.
