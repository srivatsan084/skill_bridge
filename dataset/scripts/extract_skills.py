
import csv
import re
import json
from pathlib import Path
from collections import Counter
from datetime import datetime

# --------------------------------------------------
# 1. Project paths
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[2]

POSTINGS_FILE = PROJECT_ROOT / "dataset" / "raw" / "postings.csv"
OUTPUT_DIR = PROJECT_ROOT / "dataset" / "processed"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# --------------------------------------------------
# 2. Identify relevant career roles
# More specific roles are checked first.
# Each posting is assigned to one primary role.
# --------------------------------------------------

ROLE_PATTERNS = {
    "Full Stack Developer": r"\bfull[\s-]?stack\b|\bfullstack\b",
    "Frontend Developer": r"\bfront[\s-]?end\b|\bfrontend\b",
    "Backend Developer": r"\bback[\s-]?end\b|\bbackend\b",
    "Data Scientist": r"\bdata scientist\b|\bdata science\b",
    "Data Analyst": r"\bdata analyst\b|\bbusiness intelligence analyst\b",
    "Machine Learning Engineer": r"\bmachine learning engineer\b|\bml engineer\b",
    "AI Engineer": r"\bartificial intelligence engineer\b|\bai engineer\b",
    "DevOps Engineer": r"\bdevops\b|\bsite reliability engineer\b|\bsre\b",
    "QA Automation Engineer": r"\bqa automation\b|\btest automation\b|\bautomation tester\b",
    "Mobile Developer": r"\bmobile developer\b|\bandroid developer\b|\bios developer\b",
    "Java Developer": r"\bjava developer\b|\bjava architect\b",
    "Python Developer": r"\bpython developer\b",
    "Software Engineer": r"\bsoftware engineer\b|\bsoftware developer\b",
}

ROLE_REGEX = {
    role: re.compile(pattern, re.IGNORECASE)
    for role, pattern in ROLE_PATTERNS.items()
}

# --------------------------------------------------
# 3. Technical skills and their common aliases
# Ambiguous single-letter skills such as C and R
# are intentionally excluded to reduce false matches.
# --------------------------------------------------

SKILL_PATTERNS = {
    "JavaScript": r"\bjavascript\b|\bjs\b",
    "TypeScript": r"\btypescript\b",
    "Python": r"\bpython\b",
    "Java": r"\bjava\b",
    "C++": r"(?<!\w)c\+\+(?!\w)",
    "C#": r"(?<!\w)c\#(?!\w)",
    ".NET": r"\.net\b|\bdotnet\b",
    "PHP": r"\bphp\b",
    "Ruby": r"\bruby\b",
    "Swift": r"\bswift\b",
    "Kotlin": r"\bkotlin\b",

    "React": r"\breact(?:\.js)?\b",
    "Angular": r"\bangular\b",
    "Vue.js": r"\bvue(?:\.js)?\b",
    "Next.js": r"\bnext\.js\b|\bnextjs\b",
    "Node.js": r"\bnode(?:\.js)?\b",
    "Express.js": r"\bexpress(?:\.js)?\b",
    "HTML": r"\bhtml5?\b",
    "CSS": r"\bcss3?\b",
    "Tailwind CSS": r"\btailwind(?:\s*css)?\b",
    "Bootstrap": r"\bbootstrap\b",

    "MongoDB": r"\bmongodb\b",
    "MySQL": r"\bmysql\b",
    "PostgreSQL": r"\bpostgres(?:ql)?\b",
    "SQL": r"\bsql\b",
    "Redis": r"\bredis\b",
    "Firebase": r"\bfirebase\b",

    "REST API": r"\brest(?:ful)?\s*apis?\b",
    "GraphQL": r"\bgraphql\b",
    "Git": r"\bgit\b",
    "Docker": r"\bdocker\b",
    "Kubernetes": r"\bkubernetes\b|\bk8s\b",
    "Jenkins": r"\bjenkins\b",
    "Linux": r"\blinux\b",
    "AWS": r"\baws\b|amazon web services",
    "Microsoft Azure": r"\bazure\b",
    "Google Cloud": r"\bgoogle cloud\b|\bgcp\b",
    "CI/CD": r"\bci\s*/\s*cd\b|\bcontinuous integration\b|\bcontinuous deployment\b",

    "Machine Learning": r"\bmachine learning\b",
    "Deep Learning": r"\bdeep learning\b",
    "TensorFlow": r"\btensorflow\b",
    "PyTorch": r"\bpytorch\b",
    "Scikit-learn": r"\bscikit[\s-]?learn\b",
    "Pandas": r"\bpandas\b",
    "NumPy": r"\bnumpy\b",
    "Apache Spark": r"\bapache spark\b|\bpyspark\b",
    "Hadoop": r"\bhadoop\b",

    "Selenium": r"\bselenium\b",
    "Cypress": r"\bcypress\b",
    "Playwright": r"\bplaywright\b",
    "Jest": r"\bjest\b",
    "JUnit": r"\bjunit\b",

    "Flutter": r"\bflutter\b",
    "React Native": r"\breact native\b",
}

SKILL_REGEX = {
    skill: re.compile(pattern, re.IGNORECASE)
    for skill, pattern in SKILL_PATTERNS.items()
}

# --------------------------------------------------
# 4. Counters
# --------------------------------------------------

role_posting_counts = Counter()
skill_counts = Counter()
seen_job_ids = set()

total_rows = 0
matched_rows = 0
skipped_rows = 0


def identify_role(title):
    """Return the first matching primary career role."""

    for role, pattern in ROLE_REGEX.items():
        if pattern.search(title):
            return role

    return None


def extract_skills(text):
    """Return skills found in a job posting."""

    found = set()

    for skill, pattern in SKILL_REGEX.items():
        if pattern.search(text):
            found.add(skill)

    return found


# --------------------------------------------------
# 5. Process the large CSV row by row
# --------------------------------------------------

print("Starting SkillBridge dataset processing...")

if not POSTINGS_FILE.exists():
    raise FileNotFoundError(
        f"Dataset not found: {POSTINGS_FILE}"
    )

with open(
    POSTINGS_FILE,
    "r",
    encoding="utf-8-sig",
    errors="replace",
    newline=""
) as file:

    csv.field_size_limit(10 * 1024 * 1024)

    reader = csv.DictReader(file)

    required_columns = {"job_id", "title", "description"}

    if not required_columns.issubset(set(reader.fieldnames or [])):
        raise ValueError(
            "The postings.csv file is missing required columns."
        )

    for row in reader:
        total_rows += 1

        job_id = (row.get("job_id") or "").strip()
        title = (row.get("title") or "").strip()

        if not job_id or not title:
            skipped_rows += 1
            continue

        # Avoid processing duplicate job IDs.
        if job_id in seen_job_ids:
            continue

        role = identify_role(title)

        if not role:
            continue

        description = row.get("description") or ""
        skills_desc = row.get("skills_desc") or ""

        combined_text = (
            title + " " + description + " " + skills_desc
        )

        found_skills = extract_skills(combined_text)

        seen_job_ids.add(job_id)
        matched_rows += 1

        role_posting_counts[role] += 1

        # Count each skill only once per posting.
        for skill in found_skills:
            skill_counts[(role, skill)] += 1

        if total_rows % 50000 == 0:
            print(
                f"Processed {total_rows:,} rows | "
                f"Relevant postings: {matched_rows:,}"
            )

# --------------------------------------------------
# 6. Create structured results
# --------------------------------------------------

results = []

for (role, skill), count in skill_counts.items():
    total_role_postings = role_posting_counts[role]

    percentage = (
        count / total_role_postings * 100
        if total_role_postings else 0
    )

    results.append({
        "role": role,
        "skill": skill,
        "postings_with_skill": count,
        "total_role_postings": total_role_postings,
        "percentage": round(percentage, 2)
    })

results.sort(
    key=lambda item: (
        item["role"],
        -item["postings_with_skill"]
    )
)

# --------------------------------------------------
# 7. Save JSON results
# --------------------------------------------------

summary = {
    "source": "Kaggle LinkedIn Job Postings Dataset",
    "source_file": "dataset/raw/postings.csv",
    "processed_at": datetime.now().isoformat(),
    "total_rows_read": total_rows,
    "relevant_unique_postings": matched_rows,
    "skipped_rows": skipped_rows,
    "role_posting_counts": dict(role_posting_counts),
    "skill_results": results
}

json_path = OUTPUT_DIR / "role_skill_summary.json"

with open(json_path, "w", encoding="utf-8") as file:
    json.dump(summary, file, indent=4, ensure_ascii=False)

# --------------------------------------------------
# 8. Save CSV results
# --------------------------------------------------

csv_path = OUTPUT_DIR / "role_skill_summary.csv"

with open(
    csv_path,
    "w",
    encoding="utf-8-sig",
    newline=""
) as file:

    fieldnames = [
        "role",
        "skill",
        "postings_with_skill",
        "total_role_postings",
        "percentage"
    ]

    writer = csv.DictWriter(
        file,
        fieldnames=fieldnames
    )

    writer.writeheader()
    writer.writerows(results)

# --------------------------------------------------
# 9. Display final summary
# --------------------------------------------------

print("\n===================================")
print("SKILLBRIDGE DATASET PROCESSING DONE")
print("===================================")

print(f"Total rows read: {total_rows:,}")
print(f"Relevant unique postings: {matched_rows:,}")
print(f"Skipped rows: {skipped_rows:,}")

print("\nJob postings by role:")

for role, count in role_posting_counts.most_common():
    print(f"{role}: {count:,}")

print("\nOutput files:")
print(json_path)
print(csv_path)

print("\nProcessing completed successfully!")
