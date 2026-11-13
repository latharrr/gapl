// Gapl eval fixtures - fully synthetic, deterministic (seeded). No real personal data.
// Generates labeled resume / non-resume documents for the upload-gate eval,
// expected-token lists for the PDF-extraction eval, and a baseline valid AI payload
// for the output-validator mutation eval.
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = new URL("./fixtures/", import.meta.url).pathname;
mkdirSync(join(OUT, "resumes"), { recursive: true });
mkdirSync(join(OUT, "non_resumes"), { recursive: true });

// tiny seeded PRNG so the set is reproducible
let seed = 20261114;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

const FIRST = ["Aarav", "Priya", "Rohan", "Sneha", "Vikram", "Ananya", "Karan", "Ishita", "Arjun", "Meera", "Dev", "Nisha"];
const LAST = ["Sharma", "Patel", "Gupta", "Singh", "Reddy", "Iyer", "Khan", "Verma", "Joshi", "Nair", "Das", "Kulkarni"];
const COLLEGES = ["IIT Delhi", "NIT Trichy", "Lovely Professional University", "BITS Pilani", "VIT Vellore", "Delhi University", "Anna University", "IIIT Hyderabad"];

const ARCHETYPES = [
  {
    id: "sde-fresher", title: "Software Development Engineer (Fresher)",
    skills: ["Java", "Python", "Data Structures", "Algorithms", "SQL", "Git", "React", "Node.js"],
    projects: ["Built a full-stack hostel mess management app used by 500+ students", "Developed a CLI attendance tracker in Python with SQLite storage"],
    exp: "Software Engineering Intern at a fintech startup: shipped REST APIs in Node.js, wrote unit tests, fixed 30+ production bugs.",
  },
  {
    id: "backend-3y", title: "Backend Engineer, 3 years experience",
    skills: ["Go", "PostgreSQL", "Redis", "Kafka", "Docker", "Kubernetes", "AWS", "gRPC"],
    projects: ["Designed a rate-limited notification service handling 2M messages/day", "Migrated monolith checkout flow to event-driven services, cutting p95 latency 40%"],
    exp: "Backend Engineer at a Series B e-commerce company (3 years): owned inventory service, led on-call rotation, mentored 2 junior engineers.",
  },
  {
    id: "data-analyst", title: "Data Analyst",
    skills: ["SQL", "Python", "Pandas", "Tableau", "Excel", "Statistics", "A/B Testing", "dbt"],
    projects: ["Analyzed 1.2M ride records to find demand hotspots, presented to city ops team", "Built Tableau dashboards tracking weekly retention for a consumer app"],
    exp: "Data Analyst Intern at a mobility startup: automated weekly reporting in Python, saving 6 analyst-hours per week.",
  },
  {
    id: "ml-engineer", title: "Machine Learning Engineer",
    skills: ["Python", "PyTorch", "scikit-learn", "NLP", "Docker", "MLflow", "SQL", "FastAPI"],
    projects: ["Trained a sentiment classifier on 200k product reviews (F1 0.87)", "Deployed an embedding-based duplicate-question detector behind FastAPI"],
    exp: "ML Intern at a health-tech startup: built evaluation harness for a triage model, improved recall from 0.71 to 0.83.",
  },
  {
    id: "pm-intern", title: "Aspiring Product Manager",
    skills: ["User Research", "Wireframing", "SQL", "Roadmapping", "A/B Testing", "Figma", "Analytics", "Prioritization"],
    projects: ["Ran 15 user interviews and synthesized a prioritized pain-point list for a campus app", "Specced and shipped an onboarding revamp; activation up 12%"],
    exp: "Product Intern at an ed-tech startup: owned backlog grooming, wrote PRDs, coordinated with 4 engineers and 1 designer.",
  },
  {
    id: "ux-designer", title: "UI/UX Designer",
    skills: ["Figma", "Prototyping", "User Research", "Design Systems", "Usability Testing", "HTML", "CSS", "Motion Design"],
    projects: ["Redesigned checkout flow for a D2C brand; task completion rose from 61% to 84% in usability tests", "Built a 40-component design system adopted across 3 products"],
    exp: "Product Design Intern at a SaaS startup: ran 8 usability sessions, delivered hi-fi prototypes for the analytics dashboard.",
  },
  {
    id: "marketing-grad", title: "Digital Marketing Graduate",
    skills: ["SEO", "Content Strategy", "Google Analytics", "Social Media", "Email Marketing", "Copywriting", "Canva", "Meta Ads"],
    projects: ["Grew a college fest Instagram page from 0 to 4,200 followers in 3 months", "Ran a ₹15,000 Meta Ads campaign with 3.1x ROAS for a local brand"],
    exp: "Marketing Intern at a D2C startup: managed content calendar, wrote 20+ SEO articles, tracked funnel in Google Analytics.",
  },
  {
    id: "ece-engineer", title: "Electronics Engineer pivoting to software",
    skills: ["C", "Embedded Systems", "Python", "MATLAB", "Arduino", "Circuit Design", "SQL", "Linux"],
    projects: ["Built an Arduino-based air quality monitor logging to a Python dashboard", "Simulated a 4-bit ALU in Verilog for coursework"],
    exp: "Embedded Systems Intern at an automotive supplier: wrote C firmware for a sensor module, documented test procedures.",
  },
];

const QUALITY = {
  strong: { summary: (a) => `${a.title} with shipped, measurable work. Looking for a role where I can own outcomes end to end.`, achievements: ["Won 2nd place at a national hackathon (800+ teams)", "Open-source contributor: 12 merged PRs across 4 projects", "Dean's list, top 5% of batch"], depth: "full" },
  average: { summary: (a) => `${a.title} seeking an entry-level opportunity to learn and contribute.`, achievements: ["Completed 3 online certifications", "Member of the college coding club"], depth: "medium" },
  weak: { summary: () => `Fresher looking for a job.`, achievements: [], depth: "thin" },
};

function renderResume(a, q, i) {
  const name = `${pick(FIRST)} ${pick(LAST)}`;
  const email = `${name.toLowerCase().replace(" ", ".")}${i}@example.com`;
  const phone = `+91 9${String(Math.floor(rnd() * 900000000) + 100000000)}`;
  const college = pick(COLLEGES);
  const lines = [];
  lines.push(i % 4 === 0 ? "CURRICULUM VITAE" : name);
  if (i % 4 === 0) lines.push(name);
  lines.push(`${email} | ${phone} | linkedin.com/in/${name.toLowerCase().replace(" ", "-")} | github.com/${name.split(" ")[0].toLowerCase()}${i}`);
  lines.push("");
  lines.push("SUMMARY");
  lines.push(q.summary(a));
  lines.push("");
  lines.push("EDUCATION");
  lines.push(`B.Tech, ${college}, 2021-2025, CGPA ${(6 + rnd() * 3.8).toFixed(2)}/10`);
  lines.push("");
  lines.push("SKILLS");
  lines.push(q.depth === "thin" ? a.skills.slice(0, 4).join(", ") : a.skills.join(", "));
  lines.push("");
  if (q.depth !== "thin") {
    lines.push("EXPERIENCE");
    lines.push(a.exp);
    lines.push("");
  }
  lines.push("PROJECTS");
  for (const p of q.depth === "thin" ? a.projects.slice(0, 1) : a.projects) lines.push(`- ${p}`);
  if (q.achievements.length) {
    lines.push("");
    lines.push("ACHIEVEMENTS");
    for (const ac of q.achievements) lines.push(`- ${ac}`);
  }
  const tokens = [name.split(" ")[0], "EDUCATION", "SKILLS", "PROJECTS", ...a.skills.slice(0, 4)];
  return { text: lines.join("\n"), tokens };
}

// 24 synthetic resumes: 8 archetypes x 3 quality tiers
const manifest = { generated: new Date().toISOString(), seed: 20261114, resumes: [], nonResumes: [], adversarial: [] };
let idx = 0;
for (const a of ARCHETYPES) {
  for (const [qname, q] of Object.entries(QUALITY)) {
    idx++;
    const { text, tokens } = renderResume(a, q, idx);
    const file = `resumes/${String(idx).padStart(2, "0")}-${a.id}-${qname}.txt`;
    writeFileSync(join(OUT, file), text);
    manifest.resumes.push({ file, expect: "accept", archetype: a.id, quality: qname, tokens });
  }
}

// Adversarial resumes: junk-keyword subjects (invoice, receipt, restaurant,
// purchase order) as real project work. The pre-fix gate rejected these on
// >=2 negative keywords before counting resume signals; post-fix they must
// be accepted because their resume structure is strong.
const advResume = `${pick(FIRST)} ${pick(LAST)}
adv.resume@example.com | +91 9812345678 | linkedin.com/in/adv-resume | github.com/advresume

SUMMARY
Backend engineer with 2 years of fintech experience.

EDUCATION
B.Tech Computer Science, NIT Trichy, 2019-2023, CGPA 8.1/10

SKILLS
Node.js, PostgreSQL, Redis, Docker, AWS, TypeScript

EXPERIENCE
Backend Developer at a billing startup: built an invoice generator service producing GST-compliant invoice PDFs, and a receipt parser that extracts line items from scanned receipt images. Wrote integration tests for both.

PROJECTS
- Open-source invoice template engine with 300 GitHub stars
- Receipt scanning mobile app prototype
`;
writeFileSync(join(OUT, "resumes/25-adversarial-invoice-receipt.txt"), advResume);
manifest.adversarial.push({ file: "resumes/25-adversarial-invoice-receipt.txt", idealExpectation: "accept", currentDesignExpectation: "accept", note: "Real resume whose projects involve invoices/receipts; previously rejected because >=2 negative keywords fired before resume signals were counted. Fixed: negatives only reject when resume signals are weak." });

const advRestaurantPO = `Meera Kulkarni
meera.mk@example.com | +91 9887766554 | linkedin.com/in/meera-mk | github.com/meeramk

SUMMARY
Full-stack developer, 3 years experience, hospitality and supply-chain products.

EDUCATION
B.E. Computer Engineering, VIT Vellore, 2018-2022, CGPA 8.4/10

SKILLS
TypeScript, React, Node.js, PostgreSQL, Redis, Docker

EXPERIENCE
Full-Stack Developer at a food-tech company: built the restaurant dashboard owners use to edit each menu item, and a purchase order module that auto-reorders ingredients when stock runs low.

PROJECTS
- Restaurant menu item analytics: tracks which dishes sell, per outlet
- Purchase order approval workflow with role-based access
`;
writeFileSync(join(OUT, "resumes/26-adversarial-restaurant-po.txt"), advRestaurantPO);
manifest.adversarial.push({ file: "resumes/26-adversarial-restaurant-po.txt", idealExpectation: "accept", currentDesignExpectation: "accept", note: "Real resume with restaurant menu-item and purchase-order project work (3 negative keywords); strong resume structure must win." });

const advThinBilling = `Dev Verma
dev.verma@example.com | github.com/devverma

SUMMARY
Fresher looking for backend roles.

EDUCATION
B.Tech CSE, Delhi University, 2022-2026, CGPA 7.8/10

SKILLS
Node.js, SQL, Docker

PROJECTS
- Invoice generator CLI with GST rules and PDF output
- Receipt OCR parser that tags line items
`;
writeFileSync(join(OUT, "resumes/27-adversarial-thin-billing.txt"), advThinBilling);
manifest.adversarial.push({ file: "resumes/27-adversarial-thin-billing.txt", idealExpectation: "accept", currentDesignExpectation: "accept", note: "Thin fresher resume (6 signals) with invoice+receipt projects; boundary case just above the 5-signal junk threshold." });

// 16 synthetic non-resume documents (all fabricated)
const NON = {
  "invoice.txt": `TAX INVOICE\nInvoice No: INV-2026-0412\nDate: 12 Nov 2026\nBilled To: Acme Traders, Ludhiana\n\nItems:\n1. Cotton fabric 40m @ ₹210 = ₹8,400\n2. Stitching charges = ₹1,600\n\nSubtotal: ₹10,000\nGST 18%: ₹1,800\nTotal amount due: ₹11,800\nPayment terms: 15 days. This is a computer generated invoice.`,
  "receipt.txt": `RECEIPT\nSharma General Store\nDate: 10 Nov 2026\n\nAtta 5kg - ₹240\nRice 2kg - ₹180\nSugar 1kg - ₹45\n\nTotal amount due: ₹465\nReceived in cash. Thank you, visit again.\nReceipt no: 8831`,
  "restaurant-menu.txt": `PUNJABI TADKA - RESTAURANT MENU\n\nStarters:\nPaneer Tikka - ₹220 (menu item 11)\nHara Bhara Kebab - ₹180 (menu item 12)\n\nMains:\nDal Makhani - ₹260 (menu item 21)\nButter Chicken - ₹340 (menu item 22)\n\nRestaurant timings: 11am - 11pm. Home delivery within 5 km.`,
  "research-paper.txt": `Attention Mechanisms for Low-Resource Neural Machine Translation\n\nAbstract: We study chapter 3 style encoder-decoder models...\n\nTable of Contents\n1. Introduction\n2. Related Work\n3. Method\n\nChapter 1 Introduction\nRecent work (doi:10.1145/3456.7890) shows...\n\nBibliography\n[1] Vaswani et al., 2017. doi:10.5555/3295222`,
  "purchase-order.txt": `PURCHASE ORDER\nPO Number: PO-77821\nVendor: Krishna Office Supplies\n\nItem: A4 paper, 500 sheets x 40 reams\nItem: Ball pens, box of 50 x 10\n\nTotal amount due: ₹28,400\nDelivery by: 20 Nov 2026\nAuthorized signatory: Purchase Manager`,
  "bank-statement.txt": `SAVINGS ACCOUNT STATEMENT\nAccount: XXXX4521\nPeriod: Oct 2026\n\n01 Oct - UPI/CR - ₹15,000.00\n05 Oct - UPI/DR - ₹450.00\n12 Oct - ATM WDL - ₹2,000.00\n\nClosing balance: ₹41,220.55\nThis is a system generated statement.`,
  "news-article.txt": `Monsoon rains arrived a week early this year, the weather department said on Tuesday, bringing relief to farmers across the northern plains. Reservoir levels rose to 62 percent of capacity. Markets welcomed the news, with tractor makers gaining in early trade. Officials cautioned that uneven distribution could still hurt sowing in some districts.`,
  "lorem.txt": `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.`,
  "short-junk.txt": `hello world test upload`,
  "cover-letter-thin.txt": `Dear Hiring Manager,\n\nI am writing to apply for the opening at your company. I am a hard worker and a quick learner, and I believe I would be a great fit for your team. I am available to join immediately and can relocate if needed.\n\nThank you for your time and consideration.\n\nWarm regards,\nA. Candidate`,
  "lease.txt": `RENTAL AGREEMENT\n\nThis deed of rental agreement is made at Jalandhar on 1 Nov 2026 between Mr. Harpreet Singh (landlord) and Mr. Ajay Kumar (tenant) for premises at House No. 412, Model Town, for a period of 11 months at a monthly rent of ₹12,000, payable by the 5th of each month. Lock-in period of 6 months applies to both parties.`,
  "recipe.txt": `ALOO GOBI (serves 4)\n\nIngredients:\n2 potatoes, cubed\n1 small cauliflower, florets\n1 tsp cumin seeds\n1 onion, sliced\n\nMethod: Heat oil, add cumin, then onion. Add potatoes and cauliflower, cover and cook 15 minutes. Season and serve hot with roti.`,
  "meeting-minutes.txt": `Society Maintenance Committee - Meeting Minutes\nDate: 8 Nov 2026\nAttendees: 9 members\n\n1. Lift AMC renewal approved at ₹85,000/year.\n2. Diwali lighting budget set at ₹20,000.\n3. Parking repainting to start 15 Nov.\n\nNext meeting: 10 Dec 2026.`,
  "prescription.txt": `Dr. R. Mehta, MBBS, MD (General Medicine)\nRegn No: 55421\n\nPatient: S. Kumar, 34/M\nDate: 9 Nov 2026\n\nRx:\n1. Tab Paracetamol 650mg - 1-0-1 x 3 days\n2. Tab Cetirizine 10mg - 0-0-1 x 5 days\n\nAdvice: rest, fluids. Review if fever persists beyond 3 days.`,
  "travel-itinerary.txt": `TRIP ITINERARY - RAJASTHAN\n\nDay 1: Arrive Jaipur, check in at hotel, evening bazaar walk.\nDay 2: Amber Fort, City Palace, Jantar Mantar.\nDay 3: Drive to Jodhpur, Mehrangarh Fort.\nDay 4: Clock tower market, departure.\n\nBookings confirmed under PNR 8432XXXX. Carry a valid photo ID.`,
  "ebook-toc.txt": `THE COMPLETE GUIDE TO BEEKEEPING\n\nTable of Contents\nChapter 1: Getting Started with Your First Hive\nChapter 2: Understanding Bee Behavior\nChapter 3: Seasonal Management\nChapter 4: Harvesting Honey\nChapter 5: Common Diseases and Pests\n\nAppendix A: Equipment Checklist\nAppendix B: Glossary`,
};
for (const [name, text] of Object.entries(NON)) {
  writeFileSync(join(OUT, "non_resumes", name), text);
  manifest.nonResumes.push({ file: `non_resumes/${name}`, expect: "reject" });
}

// Adversarial junk: a real invoice stuffed with resume keywords. The fix must
// not let keyword stuffing through: it carries only 4 resume signals, below
// the 5-signal threshold, so it must still be rejected.
const stuffedInvoice = `INVOICE
Invoice No: CS-9921
Date: 10 Nov 2026
Billed To: Walk-in Customer

Services:
1. Resume writing package = Rs 4,999
2. Skills assessment and experience review = Rs 2,999
3. Education verification letter = Rs 999

Subtotal: Rs 8,997
GST 18%: Rs 1,619
Total amount due: Rs 10,616
Payment terms: immediate. This is a computer generated invoice.
`;
writeFileSync(join(OUT, "non_resumes", "stuffed-invoice.txt"), stuffedInvoice);
manifest.adversarial.push({ file: "non_resumes/stuffed-invoice.txt", idealExpectation: "reject", currentDesignExpectation: "reject", note: "Adversarial junk: a real invoice stuffed with resume keywords (resume/skills/experience/education = 4 signals). Must still be rejected." });

// Baseline valid AI payload for the validator mutation eval
const baseline = {
  atsScore: 72,
  readiness: 64,
  recruiterVerdict: {
    verdict: "Maybe",
    confidence: 70,
    reason: "Solid project evidence for a fresher, but no production backend depth and no system design exposure.",
    strongestSignal: "Shipped a used product with real users",
    topGap: "No measurable scale or reliability work",
    whatWouldChangeDecision: "One deployed service with documented load or reliability numbers",
  },
  readinessBreakdown: {
    skillMatch: { score: 68 },
    projectComplexity: { score: 61 },
    deploymentEvidence: { score: 55 },
    teamCollaboration: { score: 70 },
  },
  careerGaps: [
    { skill: "System design", currentLevel: "Beginner", priority: "Critical", recommendedProject: "Build a rate-limited URL shortener with a written design doc", difficulty: "Hard", estimatedWeeks: 4, expectedReadinessAfter: 78 },
    { skill: "Testing", currentLevel: "Beginner", priority: "High", recommendedProject: "Add an integration test suite to an existing project", difficulty: "Medium", estimatedWeeks: 2, expectedReadinessAfter: 70 },
    { skill: "Cloud deployment", currentLevel: "Intermediate", priority: "Medium", recommendedProject: "Deploy with CI/CD and monitoring on a cloud provider", difficulty: "Medium", estimatedWeeks: 2, expectedReadinessAfter: 72 },
  ],
  roadmap: [
    { week: 1, title: "Design basics", description: "Learn core building blocks.", tasks: ["Read design primer", "Sketch URL shortener", "Write API contract"], milestone: "Design doc reviewed" },
    { week: 2, title: "Build core", description: "Implement the service.", tasks: ["Set up repo", "Implement endpoints", "Add storage"], milestone: "Working local service" },
    { week: 3, title: "Harden", description: "Add tests and rate limiting.", tasks: ["Write tests", "Add rate limiter", "Load test"], milestone: "p95 under 200ms at 100 rps" },
    { week: 4, title: "Deploy", description: "Ship and document.", tasks: ["Deploy", "Add monitoring", "Write README"], milestone: "Public URL with metrics" },
  ],
  missingSkills: ["System design", "Distributed systems", "Observability"],
  strongSkills: ["React", "Node.js", "SQL"],
};
writeFileSync(join(OUT, "baseline-payload.json"), JSON.stringify(baseline, null, 2));

writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`resumes: ${manifest.resumes.length} (+${manifest.adversarial.filter((a) => a.idealExpectation === "accept").length} adversarial), non-resumes: ${manifest.nonResumes.length} (+${manifest.adversarial.filter((a) => a.idealExpectation === "reject").length} adversarial)`);
