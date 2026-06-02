# Gapl — AI Application Readiness Engine

Gapl is a production-grade Application Readiness Engine. It enables users to upload resumes and job descriptions, parses and compares them with real job specifications, calculates applicant readiness, simulates hiring recruiter feedback cycles, constructs learning roadmaps, and prints professional PDF & LaTeX outputs.

---

## 🌟 Key Features

*   **Resume Parsing & JD Analysis**: Automated extraction of skills, projects, and work history.
*   **Recruiter Simulation**: Realistic recruiter evaluations, feedback comments, and hiring decisions.
*   **Centralized AI Gateway**: Multi-provider failover routing (Groq ➔ OpenAI ➔ Anthropic ➔ Gemini) with automatic fallback and latency logging.
*   **Unit Economics Dashboard**: Live Cost-Per-Report tracking (AI spend, database cost, hosting, profit margins).
*   **Asynchronous Payments**: Secure Razorpay order generation and webhook signature verification (`/api/payment/webhook`).
*   **Database Scaling**: Optimized Firestore index structures, Cursor Pagination, and Server-Side counting (`getCountFromServer`).

---

## 🛠️ Technology Stack

*   **Framework**: Next.js (App Router & Server Actions)
*   **Styling**: Tailwind CSS & shadcn/ui
*   **Database**: Google Firebase Firestore
*   **Payments**: Razorpay
*   **Hosting**: Railway / Vercel

---

## 📋 Environment Configuration

Create a `.env.local` file in the root directory and configure the following parameters:

```env
# Next Public Client Keys
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id

# Private Server API Keys
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GEMINI_API_KEY=your_gemini_api_key
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 3. Build for Production
```bash
npm run build
npm start
```

---

## 🔒 Security & RBAC Configuration

Only accounts holding administrative roles can log into the control center at `/admin`.
*   **super_admin**: Full control over user properties, refunds, subscriptions, and settings.
*   **admin**: Standard operations dashboard access.
*   **support**: Ticketing and read-only details.
*   **readonly**: Read-only statistics view.
