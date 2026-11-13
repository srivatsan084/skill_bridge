/**
 * Onboarding and Profile reference data for SkillBridge
 */

export const ACADEMIC_YEARS = [
  { id: 'First Year', label: 'First Year', semesters: ['Semester 1', 'Semester 2'] },
  { id: 'Second Year', label: 'Second Year', semesters: ['Semester 3', 'Semester 4'] },
  { id: 'Third Year', label: 'Third Year', semesters: ['Semester 5', 'Semester 6'] },
  { id: 'Fourth Year', label: 'Fourth Year', semesters: ['Semester 7', 'Semester 8'] },
];

export const CAREER_GOALS_LIST = [
  {
    id: 'Frontend Developer',
    title: 'Frontend Developer',
    description: 'Builds responsive, accessible, interactive web interfaces and client-side applications using modern HTML, CSS, JavaScript, and React.',
    iconName: 'Layout'
  },
  {
    id: 'Backend Developer',
    title: 'Backend Developer',
    description: 'Designs server architectures, microservices, databases, authentication layers, and high-performance REST/GraphQL APIs.',
    iconName: 'Server'
  },
  {
    id: 'Full Stack Developer',
    title: 'Full Stack Developer',
    description: 'Bridges frontend user experiences with scalable backend services, relational/NoSQL databases, and deployment pipelines.',
    iconName: 'Layers'
  },
  {
    id: 'Software Developer',
    title: 'Software Developer',
    description: 'Develops robust software applications, core algorithmic logic, desktop tools, and reliable software systems.',
    iconName: 'Code'
  },
  {
    id: 'Data Analyst',
    title: 'Data Analyst',
    description: 'Extracts actionable business insights from structured datasets using SQL, Python, Excel, and interactive dashboards.',
    iconName: 'BarChart3'
  },
  {
    id: 'Data Scientist',
    title: 'Data Scientist',
    description: 'Applies statistical modeling, predictive algorithms, feature engineering, and machine learning to uncover complex trends.',
    iconName: 'LineChart'
  },
  {
    id: 'AI/ML Engineer',
    title: 'AI/ML Engineer',
    description: 'Designs, trains, fine-tunes, and deploys deep learning models, neural networks, and generative LLM endpoints.',
    iconName: 'Cpu'
  },
  {
    id: 'Cloud Engineer',
    title: 'Cloud Engineer',
    description: 'Architects, provisions, and maintains scalable cloud infrastructure, virtual networks, and serverless compute.',
    iconName: 'Cloud'
  },
  {
    id: 'DevOps Engineer',
    title: 'DevOps Engineer',
    description: 'Builds automated CI/CD pipelines, containerizes applications with Docker/Kubernetes, and manages deployment uptime.',
    iconName: 'GitBranch'
  },
  {
    id: 'Cybersecurity Analyst',
    title: 'Cybersecurity Analyst',
    description: 'Safeguards applications, cloud environments, and campus networks from security vulnerabilities, malware, and intrusions.',
    iconName: 'Shield'
  }
];

export const PREDEFINED_SKILLS = {
  Programming: ['C', 'C++', 'Java', 'Python', 'JavaScript'],
  Frontend: ['HTML', 'CSS', 'React', 'Tailwind CSS'],
  Backend: ['Node.js', 'Express.js'],
  Database: ['MongoDB', 'MySQL', 'SQL'],
  Other: ['Git', 'GitHub', 'Data Structures', 'Problem Solving']
};

export const PROFICIENCY_LEVELS = [
  { level: 'Beginner', desc: 'Basic conceptual understanding & simple syntax practice' },
  { level: 'Intermediate', desc: 'Can build functional components/features independently' },
  { level: 'Advanced', desc: 'Deep mastery, production debugging & performance tuning' }
];

export const LEARNING_FORMAT_OPTIONS = [
  { id: 'Video', label: 'Video Tutorials', desc: 'YouTube walkthroughs, video courses, visual demonstrations' },
  { id: 'Documentation', label: 'Official Documentation', desc: 'Reading official specs, MDN docs, architectural guides' },
  { id: 'Interactive', label: 'Interactive Courses', desc: 'Hands-on coding playgrounds, browser labs, practice tasks' }
];

export const LEARNING_HOURS_OPTIONS = [
  '3-5 hours / week (Light)',
  '5-10 hours / week (Recommended for college students)',
  '10-15 hours / week (Intensive skill-building)',
  '15+ hours / week (Fast-track semester preparation)'
];

export const LEARNING_LANGUAGES = [
  'English',
  'Hindi',
  'Hinglish (Bilingual English + Hindi)',
  'Other Regional Languages'
];
