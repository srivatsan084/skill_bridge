/**
 * SkillBridge Backend Skill Extraction and Normalization Utility
 * Extracts technical skills from plain resume text, normalizes aliases to canonical names,
 * avoids duplicate mentions, and prevents false positives on ambiguous words.
 */

/**
 * Controlled Skill Dictionary
 * Maps canonical skill names to regex patterns matching known industry variations.
 * Primary reference: Kaggle LinkedIn Job Postings Dataset canonical skill taxonomy.
 */
const SKILL_RULES = [
  // ----------------------------------------------------
  // Programming Languages
  // ----------------------------------------------------
  {
    canonical: 'JavaScript',
    // Match 'javascript', 'ecmascript', 'es6', or standalone 'js'
    // Ensure 'js' is not a file extension or suffix like '.js' from 'react.js' or 'node.js'
    pattern: /\b(?:javascript|ecmascript|es6\+?)\b|(?<![\w\.\-])js\b(?![\w\-])/i
  },
  {
    canonical: 'TypeScript',
    pattern: /\b(?:typescript|type\s*script)\b/i
  },
  {
    canonical: 'Python',
    pattern: /\b(?:python[23]?)\b/i
  },
  {
    canonical: 'Java',
    // Match Java with word boundaries; ensure not followed by "script"
    pattern: /\bjava\b(?!\s*script)/i
  },
  {
    canonical: 'C++',
    pattern: /(?:(?<!\w)c\+\+(?!\w)|\bcpp\b)/i
  },
  {
    canonical: 'C#',
    pattern: /(?:(?<!\w)c\#(?!\w)|\bcsharp\b|\bc\s*sharp\b)/i
  },
  {
    canonical: '.NET',
    pattern: /(?:\.net(?:\s*core)?\b|\bdotnet\b|\basp\.net\b)/i
  },
  {
    canonical: 'PHP',
    pattern: /\bphp(?:\d+)?\b/i
  },
  {
    canonical: 'Ruby',
    pattern: /\b(?:ruby(?:\s*on\s*rails)?|rails)\b/i
  },
  {
    canonical: 'Swift',
    pattern: /\bswift\b/i
  },
  {
    canonical: 'Kotlin',
    pattern: /\bkotlin\b/i
  },
  {
    // Context-sensitive matching for single-letter language 'C' to prevent false positives
    canonical: 'C',
    pattern: /\b(?:c\s+programming|programming\s+in\s+c|c\s+language|embedded\s+c|c\s*(?:\/|\band\b)\s*c\+\+)\b/i
  },
  {
    // Context-sensitive matching for 'Go' / 'Golang'
    canonical: 'Go',
    pattern: /\b(?:golang|go\s+programming|go\s+language)\b/i
  },
  {
    // Context-sensitive matching for 'R' language
    canonical: 'R',
    pattern: /\b(?:r\s+programming|programming\s+in\s+r|r\s+language)\b/i
  },

  // ----------------------------------------------------
  // Frontend Web Technologies & Frameworks
  // ----------------------------------------------------
  {
    canonical: 'React Native',
    pattern: /\breact[\s-]native\b/i
  },
  {
    canonical: 'React',
    // Ensure not followed by 'native' which is classified as 'React Native'
    pattern: /\b(?:react(?:\.js)?|reactjs)\b(?!\s*native)/i
  },
  {
    canonical: 'Angular',
    pattern: /\b(?:angular(?:\.js)?|angularjs)\b/i
  },
  {
    canonical: 'Vue.js',
    pattern: /\b(?:vue(?:\.js)?|vuejs)\b/i
  },
  {
    canonical: 'Next.js',
    pattern: /\b(?:next(?:\.js)?|nextjs)\b/i
  },
  {
    canonical: 'HTML',
    pattern: /\bhtml5?\b/i
  },
  {
    canonical: 'Tailwind CSS',
    pattern: /\b(?:tailwind(?:\s*css)?|tailwindcss)\b/i
  },
  {
    canonical: 'CSS',
    pattern: /(?<!tailwind\s*)\bcss3?\b/i
  },
  {
    canonical: 'Bootstrap',
    pattern: /\bbootstrap(?:[3-5])?\b/i
  },

  // ----------------------------------------------------
  // Backend & Runtime Environments
  // ----------------------------------------------------
  {
    canonical: 'Node.js',
    pattern: /\b(?:node(?:\.js)?|nodejs)\b/i
  },
  {
    canonical: 'Express.js',
    pattern: /\b(?:express(?:\.js)?|expressjs)\b/i
  },

  // ----------------------------------------------------
  // Databases & Caches
  // ----------------------------------------------------
  {
    canonical: 'MongoDB',
    pattern: /\b(?:mongo\s*db|mongodb|mongo)\b/i
  },
  {
    canonical: 'MySQL',
    pattern: /\bmysql\b/i
  },
  {
    canonical: 'PostgreSQL',
    pattern: /\b(?:postgres(?:ql)?|postgre\s*sql|postgre)\b/i
  },
  {
    canonical: 'SQL',
    pattern: /\bsql\b/i
  },
  {
    canonical: 'Redis',
    pattern: /\bredis\b/i
  },
  {
    canonical: 'Firebase',
    pattern: /\bfirebase\b/i
  },

  // ----------------------------------------------------
  // APIs & Architectures
  // ----------------------------------------------------
  {
    canonical: 'REST API',
    pattern: /\b(?:rest(?:ful)?\s*apis?|restful\b|rest\s*web\s*services?)\b/i
  },
  {
    canonical: 'GraphQL',
    pattern: /\bgraphql\b/i
  },

  // ----------------------------------------------------
  // Cloud, DevOps & Infrastructure
  // ----------------------------------------------------
  {
    canonical: 'Git',
    pattern: /\b(?:git|github|gitlab)\b/i
  },
  {
    canonical: 'Docker',
    pattern: /\bdocker(?:file)?\b/i
  },
  {
    canonical: 'Kubernetes',
    pattern: /\b(?:kubernetes|k8s)\b/i
  },
  {
    canonical: 'Jenkins',
    pattern: /\bjenkins\b/i
  },
  {
    canonical: 'Linux',
    pattern: /\b(?:linux|ubuntu|debian|centos|redhat)\b/i
  },
  {
    canonical: 'AWS',
    pattern: /\b(?:aws|amazon\s*web\s*services)\b/i
  },
  {
    canonical: 'Microsoft Azure',
    pattern: /\b(?:(?:microsoft\s*)?azure|ms\s*azure)\b/i
  },
  {
    canonical: 'Google Cloud',
    pattern: /\b(?:google\s*cloud(?:\s*platform)?|gcp)\b/i
  },
  {
    canonical: 'CI/CD',
    pattern: /\b(?:ci\s*\/\s*cd|ci[\s-]cd|continuous\s*integration|continuous\s*deployment)\b/i
  },

  // ----------------------------------------------------
  // AI, Data Science & Machine Learning
  // ----------------------------------------------------
  {
    canonical: 'Machine Learning',
    pattern: /\bmachine\s*learning\b/i
  },
  {
    canonical: 'Deep Learning',
    pattern: /\bdeep\s*learning\b/i
  },
  {
    canonical: 'TensorFlow',
    pattern: /\btensorflow\b/i
  },
  {
    canonical: 'PyTorch',
    pattern: /\bpytorch\b/i
  },
  {
    canonical: 'Scikit-learn',
    pattern: /\b(?:scikit[\s-]?learn|sklearn)\b/i
  },
  {
    canonical: 'Pandas',
    pattern: /\bpandas\b/i
  },
  {
    canonical: 'NumPy',
    pattern: /\bnumpy\b/i
  },
  {
    canonical: 'Apache Spark',
    pattern: /\b(?:apache\s*spark|pyspark)\b/i
  },
  {
    canonical: 'Hadoop',
    pattern: /\bhadoop\b/i
  },

  // ----------------------------------------------------
  // Testing & Quality Assurance
  // ----------------------------------------------------
  {
    canonical: 'Selenium',
    pattern: /\bselenium\b/i
  },
  {
    canonical: 'Cypress',
    pattern: /\bcypress\b/i
  },
  {
    canonical: 'Playwright',
    pattern: /\bplaywright\b/i
  },
  {
    canonical: 'Jest',
    pattern: /\bjest\b/i
  },
  {
    canonical: 'JUnit',
    pattern: /\bjunit(?:5)?\b/i
  },

  // ----------------------------------------------------
  // Mobile Development
  // ----------------------------------------------------
  {
    canonical: 'Flutter',
    pattern: /\bflutter\b/i
  }
];

/**
 * Extracts normalized technical skills from plain resume text
 * @param {string} text - Raw or extracted resume text
 * @returns {string[]} Array of unique, normalized canonical skill names
 */
function extractSkillsFromText(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const cleanText = text.trim();
  if (cleanText.length === 0) {
    return [];
  }

  const recognizedSkills = new Set();

  for (const rule of SKILL_RULES) {
    if (rule.pattern.test(cleanText)) {
      recognizedSkills.add(rule.canonical);
    }
  }

  return Array.from(recognizedSkills).sort();
}

/**
 * Normalizes a skill name or alias to its canonical representation
 * @param {string} skill - Raw skill name or alias (e.g. "ReactJS", "NodeJS", "JS")
 * @returns {string} Canonical skill name (e.g. "React", "Node.js", "JavaScript")
 */
function normalizeSkill(skill) {
  if (!skill || typeof skill !== 'string') {
    return '';
  }

  const trimmed = skill.trim();
  if (trimmed.length === 0) {
    return '';
  }

  for (const rule of SKILL_RULES) {
    if (rule.pattern.test(trimmed)) {
      return rule.canonical;
    }
  }

  return trimmed;
}

/**
 * Returns list of all canonical skills supported by the extractor
 * @returns {string[]}
 */
function getSupportedSkills() {
  return SKILL_RULES.map((r) => r.canonical).sort();
}

module.exports = {
  extractSkillsFromText,
  normalizeSkill,
  getSupportedSkills,
  SKILL_RULES
};
