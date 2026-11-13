# SkillBridge – AI-Powered Skill Gap & Career Recommendation Platform

> An end-to-end full-stack career readiness platform for engineering students with automated industry skill benchmarks, resume text extraction, dynamic skill-gap analysis, and AI-powered resume rewriting with Google Gemini.

---

## 🛠️ System Architecture & Tech Stack

SkillBridge runs as three containerized services managed by Docker Compose:

- **Frontend (`frontend`)**: React 18, Vite, Tailwind CSS, Lucide React, and Recharts. Built into optimized static assets and served by **Nginx** on port `3000`.
- **API Reverse Proxy**: Nginx routes frontend traffic on port `3000` and transparently proxies `/api/*` calls to the backend on `http://backend:5000/api/*`. This provides same-origin requests, eliminating cross-origin cookie and CORS restrictions in the browser.
- **Backend API (`backend`)**: Node.js 20 & Express REST API on port `5000`. Handles JWT authentication with HttpOnly cookies, PDF/DOCX resume file uploads, regex-based skill extraction, skill-gap analysis algorithms, and Gemini AI resume enhancement.
- **Industry Dataset Automation**: On backend startup, the processed Kaggle industry dataset (`dataset/processed/role_skill_summary.json`) is automatically and idempotently upserted into MongoDB (13 career roles, 507 skills) without touching existing student or resume records.
- **Database (`mongodb`)**: MongoDB 7.0 database persisting student records, uploaded resume metadata, extracted skill profiles, and industry career benchmarks.
- **AI Engine**: Google Gemini API via official `@google/genai` SDK using `gemini-3.1-flash-lite` (configurable via `GEMINI_MODEL`).

```text
                  +----------------------------------------------+
                  |         Client Browser (Localhost)           |
                  +----------------------------------------------+
                                         │
                                         ▼ Port 3000
                  +----------------------------------------------+
                  |              frontend (Nginx)                |
                  |                                              |
                  |  - Serves compiled React SPA                 |
                  |  - Reverse-proxies /api/ to backend:5000     |
                  +----------------------------------------------+
                                         │
                                         ▼ Internal Docker Network
                  +----------------------------------------------+
                  |           backend (Node.js/Express)          |
                  |                                              |
                  |  - Runs idempotent dataset import on start   |
                  |  - JWT Auth + HttpOnly SameSite=lax cookie   |
                  |  - Resume text & skill extraction (PDF/DOCX) |
                  |  - Industry skill-gap comparison engine      |
                  |  - Google Gemini 3.1 Flash-Lite AI rewrite   |
                  +----------------------------------------------+
                                 │              │
       Persisted Volumes         ▼              ▼  External API
   +──────────────────────+  +─────────+   +───────────────+
   | resume_uploads       |  | mongodb |   | Google Gemini |
   | mongodb_data         |  | Mongo 7 |   | API (GenAI)   |
   +──────────────────────+  +─────────+   +───────────────+
```

---

## 🚀 Quickstart with Docker Compose (Recommended)

### 1. Prerequisites (Windows PC)

1. **Docker Desktop for Windows**:
   - Install from [Docker Desktop Official Site](https://www.docker.com/products/docker-desktop/).
   - Ensure the WSL 2 backend is selected in Docker Desktop settings (**Settings** > **General** > **Use the WSL 2 based engine**).
   - Start Docker Desktop and verify the whale icon in the Windows taskbar indicates it is running.

2. **Git**:
   - Installed on your Windows PC.

---

### 2. Clone the Repository

Open Windows PowerShell or Command Prompt:

```powershell
git clone <YOUR_REPOSITORY_URL>
cd Skill_Bridge
```

---

### 3. Configure Environment Variables

Create your root `.env` file from the provided `.env.example`:

**In PowerShell:**
```powershell
Copy-Item .env.example .env
```

**In Windows CMD:**
```cmd
copy .env.example .env
```

Open `.env` in your text editor (e.g. VS Code or Notepad) and configure your variables:

```env
# Security & Authentication
JWT_SECRET=your_custom_secure_jwt_secret_phrase
CLIENT_URL=http://localhost:3000

# Cookie Configuration for Local HTTP
# Keep COOKIE_SECURE=false and COOKIE_SAMESITE=lax for local localhost:3000 HTTP usage
COOKIE_SECURE=false
COOKIE_SAMESITE=lax

# Google Gemini API (Required for Resume Rewrite feature)
# Get your free key at: https://aistudio.google.com/
GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here
GEMINI_MODEL=gemini-3.1-flash-lite
```

> [!NOTE]
> The raw 500 MB Kaggle dataset is **not** required. The pre-processed dataset (`dataset/processed/role_skill_summary.json`) is tracked in Git and will be loaded into MongoDB automatically upon startup.

---

### 4. Build and Run the Entire Application

Run the following command in the project root:

```powershell
docker compose up --build
```

Docker will:
1. Start MongoDB 7.0 and wait for its healthcheck (`ping`) to pass.
2. Build the backend container, install production dependencies, automatically import the 13 career roles and 507 skills into MongoDB, and start the Express server on port 5000.
3. Build the frontend React app with Vite and launch Nginx on port 3000.

Once the logs show `[SkillBridge Server] Running in production mode on port 5000` and `frontend` is listening, the application is ready.

---

### 5. Access the Application

- **SkillBridge Web Application**: [http://localhost:3000](http://localhost:3000)
- **Backend Health Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)
- **Industry Roles API**: [http://localhost:3000/api/industry/roles](http://localhost:3000/api/industry/roles)

---

## 🧪 Testing the Complete Workflow

1. **Student Registration**:
   - Open [http://localhost:3000](http://localhost:3000) in your browser.
   - Click **Get Started** or visit `/register`.
   - Complete the registration form with your name, college, email, password, and target role (e.g. *Full Stack Developer*).
   - Upon submitting, a secure HttpOnly cookie is issued with `SameSite=lax`. Refresh the browser to verify your session persists seamlessly!

2. **Career Explorer**:
   - Navigate to **Career Explorer** (`/app/career-explorer`).
   - Notice the 13 real-world career roles and 3,804 analyzed job postings loaded live from MongoDB.
   - Click any role (e.g. *Full Stack Developer*, *Data Scientist*, *Cloud Engineer*) to view skill demands and market percentage benchmarks.

3. **Resume Analyzer & Skill Gap**:
   - Navigate to **Skill Gap Analysis** (`/app/skill-gap`).
   - Upload a sample PDF or DOCX resume.
   - The backend extracts raw text, detects your technical skills (e.g. JavaScript, React, Docker, Python), and compares them against industry job postings for your target role.
   - Review your **Matched Skills**, **Missing Industry Skills**, and **Resume-Only Skills**.

4. **AI-Powered Resume Rewrite**:
   - Inside the Resume Analyzer, click **Generate AI Rewrite** or **Improve with Gemini**.
   - Gemini 3.1 Flash-Lite analyzes your existing project descriptions and experience, rewrites them with strong action verbs and metrics without fabricating unearned credentials, and saves the result to MongoDB.

---

## 🛑 Stopping and Managing Docker Containers

### Stop containers (preserves database & uploads):
```powershell
docker compose down
```

### Stop containers and reset database & upload volumes (clean slate):
```powershell
docker compose down -v
```

### View container logs:
```powershell
# Follow all logs
docker compose logs -f

# Follow backend logs only
docker compose logs -f backend
```

### Restart a specific service:
```powershell
docker compose restart backend
```

---

## 💻 Alternative: Running Locally Without Docker

If you want to run the project directly on your host machine without Docker:

### 1. Requirements:
- Node.js 18+ installed
- MongoDB installed and running locally on `mongodb://127.0.0.1:27017`

### 2. Backend Setup:
```powershell
cd backend
copy .env.example .env
npm install
node scripts/importIndustryData.js
npm run dev
```

### 3. Frontend Setup:
In a new terminal window in the root directory:
```powershell
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (Vite dev server).

---

## 📂 Project Directory Structure

```text
Skill_Bridge/
├── backend/
│   ├── config/             # MongoDB database connection
│   ├── controllers/        # Express route controllers (auth, profile, resume, industry)
│   ├── middleware/         # Auth verification & error handling
│   ├── models/             # Mongoose schemas (Student, Resume, IndustryRoleProfile)
│   ├── routes/             # Express API routes
│   ├── scripts/            # Idempotent dataset importer (importIndustryData.js)
│   ├── utils/              # Text extractor, skill extractor, gap analyzer, resume rewriter
│   ├── uploads/            # Local resume storage directory (mounted as volume)
│   ├── .dockerignore       # Docker ignore rules for backend
│   ├── Dockerfile          # Node.js 20-alpine backend image definition
│   └── package.json        # Backend dependencies
├── dataset/
│   ├── processed/          # Processed dataset files (tracked in git)
│   │   ├── role_skill_summary.csv
│   │   └── role_skill_summary.json
│   └── scripts/            # Pre-processing extraction scripts
├── src/                    # React frontend application
│   ├── components/         # Modular UI components
│   ├── context/            # Student authentication & state context
│   ├── pages/              # Public & Student portal views
│   └── services/api.js     # Centralized API service (calls /api/...)
├── nginx.conf              # Nginx reverse proxy & static SPA configuration
├── Dockerfile              # Multi-stage frontend build & Nginx runtime
├── docker-compose.yml      # Orchestration of MongoDB, Backend, and Frontend
├── .dockerignore           # Root Docker ignore rules
├── .env.example            # Environment variable template
└── package.json            # Frontend dependencies
```

---

## 🔒 Security Best Practices

- **Zero Hardcoded Secrets**: Secrets and keys are strictly read from environment variables (`.env`).
- **Protected Environment Files**: `.env` and `backend/.env` are in `.gitignore` and `.dockerignore`.
- **HttpOnly Cookies**: Session tokens are isolated from browser JavaScript, mitigating XSS attacks.
- **Non-Root / Container Isolation**: Docker Compose network isolates internal database communication from external exposure.
