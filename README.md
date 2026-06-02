# Gapl — AI Application Readiness & Email Intelligence Engine

Gapl is a production-grade Candidate Application Readiness and Founder Analytics Engine. It leverages AI models, dynamic attribution, structured data systems, and event tracking to help candidates build ATS-optimized resumes and allow founders to trace analytics down to the exact dollar.

---

## 🚀 Core Product Capabilities

### 1. Resume Parsing & JD Analysis
*   **Multi-Format Uploads**: Support for direct PDF uploads, raw TXT file extraction, and manual copy-pasting of resume text.
*   **Job Description (JD) Mapping**: Compare candidates' resumes against customized JDs to find keyword and competency gaps.
*   **Role & Company Profiling**: Scans resumes against target roles (*SDE, Frontend, Backend, DevOps, ML, Product Manager*) and company tiers (*FAANG, Series A-C startups, Mass recruiters*).
*   **Recruiter Verdict Simulation**: Simulates the evaluation pattern of human recruiters, grading candidates on readiness percentage, ATS match, and feedback comments.

### 2. Interactive CV Builder
*   **AI Bullet Point Refactoring**: Rewrites bullet points to emphasize action verbs, evidence, and quantified metrics.
*   **Keyword Injection**: Automatically injects high-ranking target keywords matching the company tier.
*   **Times New Roman Resume Rendering**: Visual, clean Times New Roman standard single-page resume layouts.
*   **Exporting Options**:
    *   **PDF Download**: Single-page print styling overrides using custom `@media print` style wrappers.
    *   **"Email me this" Sharing**: Send formatted Times New Roman HTML resume directly to the user's inbox.

### 3. Automated Learning Roadmaps
*   **Priority-Ranked Deficits**: Groups missing competencies into High, Medium, and Low priorities.
*   **Project Recommendations**: Suggests targeted projects for candidates to build to fill skill gaps.
*   **Progress Tracking**: Tracks checked-off tasks, updating progress indicators dynamically.
*   **Milestone Sequences**: Dispatches encouragement emails as candidates reach 25%, 50%, 75%, and 100% roadmap milestones.

---

## 📧 Email Intelligence Platform (Resend Integration)

### 1. Webhook Event System (`/api/webhooks/resend`)
Tracks granular states for every email sent, saving metrics directly to Firestore:
*   `email_sent` (Sent confirmation)
*   `email_delivered` (Inbox landing)
*   `email_opened` (Open rates tracking)
*   `email_clicked` (CTA tracking)
*   `email_bounced` (Hard/soft bounce logs)
*   `email_complained` (Spam markings)
*   `email_failed` (Network dropouts)
*   `email_unsubscribed` (Candidate opting-out)
*   **Webhook Idempotency Layer**: Stores unique Svix/Resend payload IDs inside a `webhook_events` collections to prevent duplicate counting during retries.

### 2. Retention Sequences & Crons
*   **Welcome Sequence**: Automatically triggered upon Firebase signup.
*   **Report Completion Alerts**: Delivers dynamic summaries of readiness reports.
*   **Milestone Emails**: Encouragement hooks triggered on project milestones.
*   **Inactivity Recovery Crons**:
    *   `/api/cron/day1-reminder`: Emails candidates who signed up but did not generate a report within 24 hours.
    *   `/api/cron/day7-reminder`: Reminds candidates to update their profiles and check milestones.

---

## 📈 Founder Analytics & Attribution Systems

### 1. Shortlink Manager & Tracker
*   **Decoupled Domain Rewrite**: Converts long referral links into compact shortlinks (e.g. using `links.gapl.in`).
*   **Next.js Middleware Redirections**: Catches incoming shortlink subdomains and resolves them via `/api/t/[id]` instantly without layout shifts.
*   **Contextual Cookie Profiling**: Captures user agent, platform, geographical country, and unique device footprints.
*   **30-Day Last-Touch Attribution**: Attributes signups, reports, roadmaps, and transactions to specific email campaigns or shortlinks within a 30-day window.

### 2. User Timeline & Engagement Scoring
*   **Granular Timelines**: Displays chronologically structured activity records per candidate (*e.g., Signup ➔ Email Opened ➔ Clicked Link ➔ Generated Report ➔ Milestone Reached ➔ Purchased Plan*).
*   **Engagement Scoring**: Automatically weights user events (e.g. Opens = +1, Clicks = +3, Milestones = +5) to rank active vs. churn-risk candidates.

---

## 🛠️ Administrative Dashboards (`/admin/*`)

*   **Main Dashboard (`/admin`)**: Aggregates signups, active campaigns, and attribution funnel conversion rates.
*   **Email Campaign Analytics (`/admin/emails`)**: Tracks sent count, delivery rates, open rates, CTRs, and ROI metrics for all templates.
*   **Email Health Tracker (`/admin/email-health`)**: Live delivery stats, bounce rates, spam rate gauges, and SPF/DKIM verification checks.
*   **Founder Alerts System (`/admin/alerts`)**: Fires warning logs if metrics fall below target limits (*e.g., Bounce rate > 5%, Spam > 1%, conversion drop > 50%*).
*   **AI Insights Panel (`/admin/email-insights`)**: Analyzes subject lines and CTR patterns using AI, summarizing subject lines and user engagement optimizations.
*   **Shortlinks Management Panel (`/admin/links`)**: Interface to quickly create shortlinks, track click counts, and edit redirection destinations.
*   **Payments & Refunds Panel (`/admin/payments`)**: Tracks transactions, payment channels, conversion values, and issues one-click Razorpay refunds.
*   **Audit Logger (`/admin/audit`)**: Captures and displays admin actions (RBAC operations, configuration changes, user updates) for compliance.
*   **Prompts & LLM Settings (`/admin/prompts` / `/admin/settings`)**: Interface to adjust prompt instructions, model preferences, and fallbacks live.

---

## 💻 Tech Stack & Architecture

*   **Frontend & Routing**: Next.js App Router (Turbopack optimized)
*   **Styling**: Vanilla Tailwind CSS & shadcn/ui
*   **Database & Auth**: Google Firebase Auth & Cloud Firestore
*   **Attribution Routing**: Next.js custom Edge Middleware
*   **Email Engine**: Resend Node SDK
*   **AI Orchestrator**: Central Gateway with automatic fallback (Groq ➔ OpenAI ➔ Anthropic ➔ Gemini)
*   **Payments**: Razorpay Gateway (HMAC Signature Webhooks verification)

---

## 📋 Local Setup

### 1. Environment Variables
Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Server Keys & SDK Config
FIREBASE_CLIENT_EMAIL=your_admin_client_email
FIREBASE_PRIVATE_KEY="your_admin_private_key"

# AI Gateways
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GEMINI_API_KEY=your_gemini_api_key

# Payment Gateways
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Email Configurations
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Launch Steps
1.  **Install Packages**:
    ```bash
    npm install
    ```
2.  **Start Dev Server**:
    ```bash
    npm run dev
    ```
3.  **Build Code**:
    ```bash
    npm run build
    ```

---

## 🔒 Role-Based Access Control (RBAC)

Administrative controls at `/admin` are gated using Firestore custom claim user roles:
*   `super_admin`: Full database access, refund configurations, prompt overriding, and user creation.
*   `admin`: Full management dashboard access, excluding user role configuration edits.
*   `support`: Read-only access to customer profiles, timelines, and payment histories.
*   `readonly`: General read-only access to statistics and metrics charts.
