// Sample demo data for SkillBridge Frontend Prototype
// Clearly labelled as sample data for collegiate demonstration

export const SAMPLE_STUDENT = {
  id: "std-2024-042",
  name: "Aarav Sharma",
  email: "aarav.sharma@college.edu",
  college: "National Institute of Technology",
  degree: "B.Tech in Computer Science & Engineering",
  academicYear: "2nd Year",
  semester: "Semester 4",
  graduationYear: 2026,
  targetRole: "Full-Stack Web Developer",
  overallReadiness: 62, // percentage
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
  bio: "Passionate CS sophomore looking to master the MERN stack and cloud fundamentals before junior year internships.",
  skillsAcquired: [
    { name: "HTML5 & Semantic Markup", level: "Advanced", score: 90, category: "Frontend" },
    { name: "CSS3 & Tailwind CSS", level: "Proficient", score: 85, category: "Frontend" },
    { name: "JavaScript (ES6+)", level: "Proficient", score: 75, category: "Languages" },
    { name: "Git & GitHub Basics", level: "Proficient", score: 80, category: "Tools" },
    { name: "Data Structures in C++", level: "Intermediate", score: 70, category: "Core CS" }
  ],
  skillsToImprove: [
    { name: "React.js State & Hooks", status: "In Progress", urgency: "High", gap: "25% to benchmark", targetLevel: "Proficient" },
    { name: "Node.js & Express REST APIs", status: "Learning", urgency: "High", gap: "45% to benchmark", targetLevel: "Intermediate" },
    { name: "MongoDB Schema Design", status: "Not Started", urgency: "Medium", gap: "60% to benchmark", targetLevel: "Intermediate" },
    { name: "Web Security & JWT Auth", status: "Not Started", urgency: "Medium", gap: "70% to benchmark", targetLevel: "Intermediate" },
    { name: "Basic Docker & Deployment", status: "Not Started", urgency: "Low", gap: "85% to benchmark", targetLevel: "Basic" }
  ],
  nextRecommendedActivity: {
    title: "Building RESTful APIs with Express.js",
    platform: "freeCodeCamp / Official Express Guide",
    estimatedTime: "45 mins",
    type: "Interactive Tutorial",
    skill: "Node.js & Express REST APIs",
    description: "Learn how to route HTTP requests, handle middleware, and structure a controller pattern."
  }
};

export const CAREER_ROLES = [
  {
    id: "full-stack-dev",
    title: "Full-Stack Web Developer",
    category: "Web Development",
    shortDescription: "Architects client-side user interfaces and scalable server-side APIs and database integrations.",
    industryDemand: "High Demand",
    averageEntryReadiness: "Junior / Associate",
    bestStartingSemester: "Semester 3 or 4",
    primarySkills: ["JavaScript", "React.js", "Node.js", "Express.js", "MongoDB / PostgreSQL", "REST APIs", "Git"],
    secondarySkills: ["Docker", "Tailwind CSS", "Testing (Jest)", "TypeScript", "CI/CD basics"],
    typicalProjects: [
      "Collaborative Task Management App",
      "E-commerce API with Stripe / Razorpay integration",
      "Full-stack Social Network or Forum"
    ]
  },
  {
    id: "frontend-engineer",
    title: "Frontend Engineer",
    category: "Web Development",
    shortDescription: "Specializes in modern user interfaces, responsive design, performance optimization, and web accessibility.",
    industryDemand: "High Demand",
    averageEntryReadiness: "Junior / Associate",
    bestStartingSemester: "Semester 2 or 3",
    primarySkills: ["HTML5 / Modern CSS", "JavaScript (ES6+)", "React.js / Next.js", "Tailwind CSS", "Web Vitals & Performance"],
    secondarySkills: ["Figma / UI Design", "TypeScript", "State Management (Zustand/Redux)", "Unit Testing"],
    typicalProjects: [
      "Accessible Component Library",
      "Real-time Dashboard with Interactive Charts",
      "Progressive Web App (PWA)"
    ]
  },
  {
    id: "backend-engineer",
    title: "Backend Engineer",
    category: "Systems & Backend",
    shortDescription: "Designs resilient microservices, database schemas, authentication layers, and high-throughput server APIs.",
    industryDemand: "Very High Demand",
    averageEntryReadiness: "Junior / Associate",
    bestStartingSemester: "Semester 4 or 5",
    primarySkills: ["Node.js / Python / Java", "Express / FastAPI / Spring", "PostgreSQL / MySQL", "Redis Caching", "API Design"],
    secondarySkills: ["System Design fundamentals", "Docker & Kubernetes", "Message Queues (Kafka/RabbitMQ)", "Security"],
    typicalProjects: [
      "Distributed Rate Limiter Service",
      "High-concurrency URL Shortener",
      "Scalable Authentication & OAuth2 Service"
    ]
  },
  {
    id: "cloud-devops-engineer",
    title: "Cloud & DevOps Associate",
    category: "Cloud & Infrastructure",
    shortDescription: "Automates continuous integration, manages cloud servers, and ensures high availability of software systems.",
    industryDemand: "Growing Fast",
    averageEntryReadiness: "Junior",
    bestStartingSemester: "Semester 5 or 6",
    primarySkills: ["Linux CLI & Bash", "Docker & Containerization", "AWS / Azure Basics", "GitHub Actions CI/CD", "Networking basics"],
    secondarySkills: ["Kubernetes", "Terraform (IaC)", "Monitoring (Prometheus/Grafana)", "Python scripting"],
    typicalProjects: [
      "Automated CI/CD Pipeline for Microservices",
      "Multi-container Deployment with Docker Compose & Nginx",
      "Terraform Script for AWS VPC & EC2 Cluster"
    ]
  },
  {
    id: "data-analyst",
    title: "Junior Data Analyst",
    category: "Data Science & Analytics",
    shortDescription: "Extracts insights from structured data, creates executive dashboards, and supports decision-making.",
    industryDemand: "Moderate to High",
    averageEntryReadiness: "Junior",
    bestStartingSemester: "Semester 3 or 4",
    primarySkills: ["Python (Pandas, NumPy)", "SQL & Database Querying", "Data Visualization (Tableau/PowerBI/Matplotlib)", "Excel Advanced"],
    secondarySkills: ["Statistics & Hypothesis Testing", "ETL basics", "Business Communication"],
    typicalProjects: [
      "Customer Churn Analysis Dashboard",
      "E-commerce Sales Trends & Cohort Analysis",
      "Automated Daily KPI Reporter Script"
    ]
  },
  {
    id: "ai-ml-engineer",
    title: "Junior AI/ML Engineer",
    category: "Artificial Intelligence",
    shortDescription: "Builds and deploys machine learning models, fine-tunes LLMs, and integrates intelligent endpoints.",
    industryDemand: "Very High",
    averageEntryReadiness: "Junior / Graduate",
    bestStartingSemester: "Semester 5 or 6",
    primarySkills: ["Python", "Linear Algebra & Calculus", "Scikit-Learn", "PyTorch / TensorFlow", "Data Preprocessing"],
    secondarySkills: ["Hugging Face Transformers", "Prompt Engineering & RAG", "MLOps / FastAPI deployment", "Vector DBs"],
    typicalProjects: [
      "Document Q&A with Retrieval-Augmented Generation",
      "Computer Vision Object Detection Pipeline",
      "Predictive Maintenance Time-Series Model"
    ]
  }
];

export const ROADMAP_SEMESTERS = [
  {
    semester: "Semester 3 (Completed)",
    title: "Foundations & Web Basics",
    status: "completed",
    focus: "Core CS, Advanced Programming & Frontend Essentials",
    milestones: [
      { name: "Object Oriented Programming in C++ / Java", done: true },
      { name: "Data Structures (Arrays, Linked Lists, Stacks, Queues)", done: true },
      { name: "HTML5 Semantic Markup & Modern CSS", done: true },
      { name: "Version Control with Git & GitHub workflow", done: true }
    ]
  },
  {
    semester: "Semester 4 (Current Semester)",
    title: "Frontend Mastery & Server Fundamentals",
    status: "in-progress",
    focus: "Modern Single Page Apps and REST API Creation",
    milestones: [
      { name: "JavaScript ES6+, Asynchronous JS & Promises", done: true },
      { name: "React.js: Components, Props, State & Hooks", done: false, active: true },
      { name: "Node.js & Express.js REST API fundamentals", done: false },
      { name: "Build & Deploy 1 Full-Stack Project on Vercel / Render", done: false }
    ]
  },
  {
    semester: "Semester 5 (Upcoming)",
    title: "Databases, Authentication & System Concepts",
    status: "upcoming",
    focus: "Databases, Backend Architecture & Internship Preparation",
    milestones: [
      { name: "Database Management Systems (SQL & MongoDB NoSQL)", done: false },
      { name: "User Authentication (JWT, Cookies, OAuth2)", done: false },
      { name: "Operating Systems & Computer Networks Core Concepts", done: false },
      { name: "LeetCode medium problem solving practice (100+ questions)", done: false }
    ]
  },
  {
    semester: "Semester 6 (Upcoming)",
    title: "Advanced Engineering, Cloud & Capstone",
    status: "upcoming",
    focus: "DevOps basics, Capstone Project & Campus Placement Readiness",
    milestones: [
      { name: "Docker Containerization & GitHub Actions CI/CD", done: false },
      { name: "Production-ready Capstone Web Application", done: false },
      { name: "Mock Technical Interviews & Resume Polishing", done: false },
      { name: "Summer Internship or Open Source Contribution", done: false }
    ]
  }
];

export const LEARNING_RESOURCES = [
  {
    id: "res-1",
    title: "React Official Tutorial & Documentation",
    provider: "React Team",
    type: "Official Documentation",
    format: "Interactive Docs",
    skill: "React.js",
    category: "Frontend",
    cost: "100% Free",
    level: "Beginner to Intermediate",
    url: "https://react.dev/learn",
    description: "The official interactive guide to thinking in React, components, state management, and effects."
  },
  {
    id: "res-2",
    title: "Full Stack Web Development Course",
    provider: "freeCodeCamp.org",
    type: "Comprehensive Course",
    format: "Video + Hands-on",
    skill: "Full-Stack Web Development",
    category: "Web Development",
    cost: "100% Free",
    level: "Beginner",
    url: "https://www.freecodecamp.org/",
    description: "Verified free curriculum covering responsive web design, JavaScript algorithms, and backend APIs."
  },
  {
    id: "res-3",
    title: "MDN Web Docs - JavaScript Guide",
    provider: "Mozilla Developer Network",
    type: "Official Documentation",
    format: "Documentation",
    skill: "JavaScript (ES6+)",
    category: "Languages",
    cost: "100% Free",
    level: "All Levels",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
    description: "The industry standard reference for JavaScript syntax, DOM manipulation, APIs, and modern ES6 features."
  },
  {
    id: "res-4",
    title: "Node.js and Express.js - Full Course for Beginners",
    provider: "freeCodeCamp / John Smilga",
    type: "Video Course",
    format: "YouTube (8 Hours)",
    skill: "Node.js & Express REST APIs",
    category: "Backend",
    cost: "100% Free",
    level: "Intermediate",
    url: "https://www.youtube.com/watch?v=Oe421EPjeBE",
    description: "Deep dive into building Node servers, Express routers, middleware, static files, and database connections."
  },
  {
    id: "res-5",
    title: "MongoDB University - Free Developer Learning Path",
    provider: "MongoDB Official",
    type: "Interactive Course",
    format: "Interactive Labs",
    skill: "MongoDB Schema Design",
    category: "Databases",
    cost: "100% Free",
    level: "Beginner to Intermediate",
    url: "https://learn.mongodb.com/",
    description: "Official free hands-on labs for document modeling, queries, aggregation pipelines, and indexing."
  },
  {
    id: "res-6",
    title: "Git and GitHub for Beginners - Crash Course",
    provider: "Traversy Media / freeCodeCamp",
    type: "Video Tutorial",
    format: "YouTube (1 Hour)",
    skill: "Git & GitHub Basics",
    category: "Tools",
    cost: "100% Free",
    level: "Beginner",
    url: "https://www.youtube.com/watch?v=RGOj5yH7evk",
    description: "Learn git clone, branch, commit, push, pull requests, merge conflict resolution, and best practices."
  },
  {
    id: "res-7",
    title: "Roadmap.sh - Community Developer Roadmaps",
    provider: "roadmap.sh",
    type: "Visual Learning Path",
    format: "Interactive Guides",
    skill: "Career Planning",
    category: "Career Guidance",
    cost: "100% Free",
    level: "All Levels",
    url: "https://roadmap.sh/",
    description: "Community-driven visual roadmaps and study guides for modern developer tracks."
  },
  {
    id: "res-8",
    title: "Tailwind CSS v3 Official Documentation",
    provider: "Tailwind Labs",
    type: "Official Documentation",
    format: "Interactive Docs",
    skill: "CSS3 & Tailwind CSS",
    category: "Frontend",
    cost: "100% Free",
    level: "Beginner to Intermediate",
    url: "https://tailwindcss.com/docs",
    description: "Utility-first CSS framework documentation with interactive examples, flexbox, grid, and dark mode."
  }
];

export const SKILL_GAP_COMPARISON = {
  role: "Full-Stack Web Developer",
  studentScore: 62,
  benchmarkScore: 85,
  categories: [
    { name: "Frontend Development", studentScore: 82, benchmark: 85 },
    { name: "Backend & APIs", studentScore: 40, benchmark: 80 },
    { name: "Databases & Storage", studentScore: 35, benchmark: 75 },
    { name: "DevOps & Deployment", studentScore: 20, benchmark: 65 },
    { name: "Git & Collaboration", studentScore: 80, benchmark: 80 },
    { name: "Core CS & Problem Solving", studentScore: 70, benchmark: 75 }
  ]
};
