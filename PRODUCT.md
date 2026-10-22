# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Indian CS students in placement season, mostly tier-2/3 college B.Tech/B.E. students preparing for SDE internships and full-time placements (also Data Analyst, AI/ML, PM roles). They have applied and heard nothing back, and want to know why. Most open their report on a mid-range Android phone, often between classes or late at night.

## Product Purpose

Gapl reads a resume against a chosen role and company tier, simulates a recruiter's screen, and returns an honest verdict (Shortlist / Maybe / Reject) with the reason, the gaps behind it, and a week-by-week roadmap of exactly what to build to close them. Success: a student understands why they are being filtered out and has a concrete next project, then returns to re-analyze and watches readiness rise.

## Positioning

Two things together, equally weighted: (1) a blunt recruiter verdict followed by a prescription of what to build, not keyword stuffing; (2) calibration to Indian hiring tiers (Mass Recruiter, Product Startup, Top Product) and placement-season reality. ATS scorers like Jobscan or Resume Worded score keywords; Gapl tells you the verdict and the project that changes it.

## Operating Context

- Analyze flow: pick role → pick company tier → upload PDF/TXT or paste resume → optional JD → staged loading → report.
- Report: ATS score, readiness score with breakdown (skill match, project complexity, deployment evidence, team collaboration), recruiter verdict with confidence, strongest signal, top gap, what would change the decision, prioritized career gaps with recommended projects, weekly roadmap, missing/strong skills.
- Also: CV builder (Times New Roman print/PDF export, email to self), resume tailoring against a JD, dashboard (reports, roadmaps, progress, my CVs, billing, settings), public sample report at /demo.
- Founder admin panel exists (/admin/*) but is an internal tool.

## Capabilities and Constraints

- Next.js 16 App Router, React 19, Tailwind v4, framer-motion, lucide-react, Firebase auth/Firestore, Razorpay payments, Resend email.
- Plans (INR), all on the public pricing grid: Free (1 analysis a month), Basic ₹49 (5 a month), Pro ₹149 (20 a month), Premium ₹299 (50 a month). Credits reset on the 1st of each month. Payment is a one-off Razorpay order; there is no auto-renewal or plan expiry in code yet, so copy must not say "billed monthly".
- Scores are AI estimates; product copy must say so and explain the gaps behind them.
- Domain: gapl.in. Contact: hello@gapl.in.

## Brand Commitments

- Name: Gapl. Voice: direct, honest, like a sharp senior reviewing your CV. Not hype.
- Must not feel like a generic AI SaaS (indigo gradients, sparkle badges, icon-card grids, glass), not gamified (no confetti, mascots, streaks), and not a corporate HR tool (Naukri/Workday grey).

## Evidence on Hand

- Real: the product's report structure and a sample report at /demo; real pricing above.
- None: no real testimonials, user counts, placement outcomes, or company logos. The Aryan/Priya/Karan testimonials in `src/lib/mock-data.ts` are placeholders and must never be shown. Do not invent stats or outcomes.

## Product Principles

1. The verdict comes first and is never softened; the reason is always next to it.
2. Every gap ends in something to build, with time and expected readiness change.
3. Show the report, don't describe it: the real artifact is the proof.
4. Honest about estimation: scores are explained, never presented as certainty.
5. Phone-first legibility: a report must read cleanly on a 360px Android screen.

## Accessibility & Inclusion

Mobile-first on low/mid-range Android, variable connectivity; keep payloads lean and text legible at small widths. English-language UI.
