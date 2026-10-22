---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/app/analyze/page.tsx","src/app/report/[id]/page.tsx","src/app/demo/page.tsx"]
---

Scope: Gapl landing (/) as the first surface of a replacement world (replacing "PNR Status") that reaches every user-facing route: pricing, auth, analyze, report, demo, dashboard, CV builder, tailor, reading pages, status pages and emails. Admin inherits the tokens. Mode: Persuade (landing, pricing); app routes are Operate and inherit the world.

Audience: Indian CS students in placement season, on mid-range Android phones, often late at night. Action: upload a resume and get a verdict (role + tier → /analyze). Proof: the real report structure and a labelled sample resume. No testimonials, stats or outcomes.

User feedback on the old world (2026-10-22): too themed/gimmicky, dated/not premium, too dense on phones, did not convert. The new world must read premium and calm; the marks are precise, never cartoon hand-drawing.

## Direction contract

THESIS: Your resume, read the way a recruiter reads it. The page shows the six-second read itself: what caught the eye (highlighter), what sank it (red pen, circled, with a margin note), the verdict written on the page, and the fix written back in blue. It refuses the category's centred headline + upload box + dashboard screenshot.

OWN-WORLD: A charcoal desk ground (#16171b family) with bright white A4 paper as the only other material. Three marks carry all meaning: highlighter yellow (seen, strengths, the primary action), red pen (gaps, Reject), blue ballpoint (what to build, your fix). Marks are geometrically precise: crisp highlight blocks, straight 2px underlines, rounded-rect circles, margin notes set in the UI face with a thin leader. Mona Sans for every UI word and figure (tabular), a Computer Modern-style serif only for resume text, the LaTeX resume every CS student knows.

STORY: The visitor sees a resume like theirs being read in six seconds, recognises the line that sinks it, understands Gapl writes the fix back with a readiness change, and drops their own PDF.

FIRST VIEWPORT: Desk-ground nav (wordmark with a highlighter block, three links, small yellow action). Left 5 columns: headline "Six seconds. Here's what they saw." at display scale, the second sentence highlighted; one-line lead; a working drop zone with role and tier and a yellow "Read my resume" button. Right 7 columns: a full-height white sample resume page (labelled sample) cropped by the fold, carrying the recruiter's marks, a red-ruled "Reject · 6 sec" verdict and one red margin note: "No deployed project."

FORM: The Recruiter's Read, my top-ranked grounded candidate (#1 of 7), chosen by the user as IMPECCABLE'S PICK over the roll's assigned #6 (The Shortlist). Seed key 98ffa349, re-roll 1. Signature interaction: the six-second read. On first view a 0.0→6.0s timer runs while highlight blocks draw left to right in reading order, the red circle strokes on, the margin note lands and the verdict prints last. Below, a struck red resume line flips to the blue rewritten line with readiness 65 → 78. Motion grammar: ink drawing on, ease-out-expo, nothing bounces; reduced motion shows the final marked page.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
