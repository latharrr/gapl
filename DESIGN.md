---
name: Gapl
description: Your resume, read the way a recruiter reads it — a charcoal desk, white paper, and three marks.
colors:
  desk: "#fcfcfc"
  desk-raised: "#f2f2ee"
  desk-line: "#e1e1db"
  desk-ink: "#16171b"
  desk-muted: "#5e616a"
  desk-faint: "#75787f"
  surface: "#ffffff"
  surface-muted: "#f2f2ee"
  surface-subtle: "#e8e8e3"
  border: "#e1e1db"
  border-strong: "#c3c3bb"
  ink: "#16171b"
  ink-secondary: "#3b3d45"
  ink-muted: "#5e616a"
  ink-faint: "#75787f"
  highlight: "#ffe14d"
  highlight-deep: "#f4cd16"
  highlight-soft: "#fff0a3"
  primary: "#2856d4"
  primary-foreground: "#ffffff"
  primary-50: "#eef2fd"
  primary-100: "#dbe4fb"
  primary-400: "#6d8ee8"
  primary-500: "#3a66dc"
  primary-700: "#1f44a8"
  primary-900: "#142c6e"
  danger: "#c8302a"
  danger-deep: "#a32520"
  danger-bg: "#fbeae8"
  danger-border: "#f0bcb7"
  danger-on-desk: "#c8302a"
  success: "#17784a"
  success-bg: "#e3f2e9"
  success-border: "#a8d5bb"
  warning: "#94600a"
  warning-bg: "#fbf0d6"
  warning-border: "#ecd08f"
typography:
  display:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "clamp(2.6rem, 5.6vw, 4.75rem)"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "clamp(2.25rem, 4.6vw, 3.75rem)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.045em"
  page-title:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "clamp(1.875rem, 4vw, 2.5rem)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.045em"
  title:
    fontFamily: "Mona Sans, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  sheet-title:
    fontFamily: "Mona Sans, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Mona Sans, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.625
  body-lead:
    fontFamily: "Mona Sans, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  reading:
    fontFamily: "Mona Sans, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.7
  button:
    fontFamily: "Mona Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    letterSpacing: "-0.005em"
  label:
    fontFamily: "Mona Sans, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1rem
    letterSpacing: "0.08em"
  figure:
    fontFamily: "Mona Sans, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 96"
  figure-hero:
    fontFamily: "Mona Sans, system-ui, sans-serif"
    fontSize: "clamp(3.25rem, 8vw, 4.5rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 96"
  verdict:
    fontFamily: "Mona Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 750
    lineHeight: 1.2
    letterSpacing: "0.07em"
    fontVariation: "'wdth' 110"
  wordmark:
    fontFamily: "Mona Sans, system-ui, sans-serif"
    fontSize: "1.3125rem"
    fontWeight: 820
    lineHeight: 1
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 112"
  resume:
    fontFamily: "CMU Serif, Latin Modern Roman, Georgia, serif"
    fontSize: "max(8px, 1.82cqw)"
    fontWeight: 400
    lineHeight: 1.38
rounded:
  mark: "2px"
  sample-page: "3px"
  tag: "4px"
  page: "4px"
  badge: "5px"
  page-wide: "6px"
  button-sm: "7px"
  control: "8px"
  button-lg: "9px"
  card: "10px"
  dropzone: "12px"
  pill: "9999px"
spacing:
  gutter: "16px"
  gutter-sm: "24px"
  sheet-x: "24px"
  sheet-y: "16px"
  card: "24px"
  section-y: "80px"
  section-y-lg: "112px"
components:
  button-primary:
    backgroundColor: "{colors.highlight}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.highlight-deep}"
    textColor: "{colors.ink}"
  button-primary-disabled:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.ink-faint}"
  button-secondary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.ink-secondary}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "40px"
  button-ghost:
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.control}"
    height: "40px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
  button-danger-hover:
    backgroundColor: "{colors.danger-deep}"
  button-desk:
    textColor: "{colors.desk-ink}"
    rounded: "{rounded.button-lg}"
    height: "48px"
  button-desk-hover:
    backgroundColor: "{colors.desk-raised}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "40px"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.highlight}"
  verdict-reject:
    textColor: "{colors.danger}"
    typography: "{typography.verdict}"
    rounded: "{rounded.tag}"
  verdict-maybe:
    textColor: "{colors.warning}"
    typography: "{typography.verdict}"
    rounded: "{rounded.tag}"
  verdict-shortlist:
    textColor: "{colors.success}"
    typography: "{typography.verdict}"
    rounded: "{rounded.tag}"
  tag-critical:
    backgroundColor: "{colors.danger-bg}"
    textColor: "{colors.danger}"
    rounded: "{rounded.tag}"
  tag-high:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning}"
    rounded: "{rounded.tag}"
  tag-next:
    backgroundColor: "{colors.highlight}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tag}"
  wordmark:
    backgroundColor: "{colors.highlight}"
    textColor: "{colors.ink}"
    typography: "{typography.wordmark}"
    rounded: "{rounded.sample-page}"
    padding: "0 8px"
    height: "32px"
  sheet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
  page:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.page}"
  desk-nav:
    backgroundColor: "{colors.desk}"
    textColor: "{colors.desk-muted}"
    height: "64px"
---

# Design System: Gapl

## Overview

**Creative North Star: "The Recruiter's Read"**

> **2026-10-30, the light redesign (branch `living`).** The whole product moved from the charcoal desk to light paper, modelled on Mercor and Gem: page `#fcfcfc`, editorial Newsreader serif for every headline, square 2px landing buttons, warm daylight photography of one sunlit table (`public/living/img`), a scroll film (`public/living/frames`) and GSAP + Lenis motion on the landing. The `desk-*` token names were kept and now hold the light values, so every screen follows. The three marks, the verdict words and CMU Serif for resume text are unchanged. Where the text below still says "charcoal", read "light paper".

Gapl shows a student their resume the way a recruiter reads it: six seconds, a pen, a highlighter. The whole interface is that scene. A charcoal desk is the ground; white sheets of paper lie on it; and everything the product has to say is written onto the paper with three marks. A highlighter block says what caught the eye. A red pen underlines, strikes, rings and annotates what sank it, and writes the verdict. A blue ballpoint writes the fix back. The marks are geometrically precise (crisp blocks, straight 2px rules, a rounded-rect ring, short leader lines into the margin), never wobbly or hand-drawn.

The system is quiet so the marks can be loud. Type is one variable sans, Mona Sans, set heavy and slightly wide for headlines and condensed-tabular for figures; resume text alone is set in CMU Serif, the Computer Modern face of the one-page LaTeX template most CS students already use, so the sample page reads as *their* resume. Density sits between a document and a tool: generous section rhythm on the desk, hairline-ruled rows on paper. The previous Indian-Railways reservation-chart world was retired by the user as too themed, dated and dense; none of its devices carry over.

The signature is the six-second read: a sample resume that, once it scrolls into view, gets marked in reading order while a clock runs to 6 sec and a red `Reject` prints in the margin. It is followed by the fix being written back: a struck coursework line, then blue "Build instead" rows, with readiness counting up.

**Key Characteristics:**
- Two materials: a light paper ground (`desk`, #fcfcfc) and white sheets on it, plus warm daylight photography on the landing.
- Three marks carry all meaning: highlighter (seen, and the one action), red pen (what sank it), blue ballpoint (the fix).
- Verdicts are written words in a ruled box, never colour alone.
- Newsreader serif for headlines, Mona Sans for every UI word and figure, CMU Serif only for resume text.
- One motion curve (ease-out-expo); marks draw on, nothing bounces; reduced motion shows the finished page.

## Colors

A near-neutral desk and paper, with three saturated ink colours that each mean exactly one thing.

### Primary
- **Highlighter Yellow** (`highlight`): what the recruiter's eye caught, and, at full strength, the single primary action per view (button fill), the wordmark plate, the hero sentence, the selected-chip text on ink, the active nav icon, the `Next` tag and text selection. Deepens to **Highlighter Pressed** (`highlight-deep`) on hover.
- **Soft Highlighter** (`highlight-soft`): the inline highlight behind words on paper (`mark-hl`, the six-second read's highlight blocks, "Strong on your resume" skill chips, the chosen option label, the recommended pricing column at 40%).

### Secondary
- **Red Pen** (`danger`): what sank it. The 2px underline, the strike, the ring around an entry, margin notes, the `Reject` verdict, the weakest readiness component, missing skills (ruled with `danger-border`), the Critical priority tag, error text and destructive buttons (pressed: `danger-deep`). `danger-bg` is the faint wash behind Critical tags and error panels.
- **Red Pen on the Desk** (`danger-on-desk`): now equal to `danger`, since the desk is light. Kept as a token so existing uses still resolve.

### Tertiary
- **Blue Ballpoint** (`primary`, deepened to `primary-700` for text on paper): the fix. Recommended builds, "What would change it", "Build instead" rows, milestones, readiness deltas on paper (`65 → 78`, the `→ N` column), links, the focus ring and the input focus border. `primary-50` / `primary-100` are the faint wash and ring of the `fix` tag. Blue is never a fill for a primary button.

### Verdict-only colours
- **Shortlist Green** (`success`, with `success-bg`, `success-border`): only the `Shortlist` verdict word and success states (toast icon, confirmations). Never for figures, bars or scores.
- **Maybe Ochre** (`warning`, with `warning-bg`, `warning-border`): only the `Maybe` verdict and the `High` priority tag.

### Neutral
- **Desk Paper** (`desk`, #fcfcfc since 2026-10-30): the ground of marketing, auth, analyze, report, demo, pricing, reading and status screens, the nav, the footer and the dashboard sidebar; also the `<html>` background and theme colour.
- **Desk Raised** (`desk-raised`): the hero drop-zone tray and hover fills on the desk. **Desk Line** (`desk-line`): every rule and outline on charcoal.
- **Desk Ink / Muted / Faint** (`desk-ink`, `desk-muted`, `desk-faint`): headline, body and metadata text on the desk.
- **Paper** (`surface`): every sheet, page, card, input, and the full-bleed white bands (Contents, FAQ) on the landing.
- **The Pad** (`surface-muted`): the working ground of Operate screens only (dashboard, CV builder, tailor), plus row hovers inside paper. `surface-subtle` is progress tracks, ghost hover, flat cards and segmented-control wells.
- **Rule** (`border`) and **Strong Rule** (`border-strong`): hairline row dividers; input, outline-button and chip strokes.
- **Ink** (`ink`, `ink-secondary`, `ink-muted`, `ink-faint`): headings and figures; prose; labels and metadata; placeholders and pending states. Ink is also the fill of the secondary button, neutral progress bars and done-step circles.

### Named Rules
**The Three Marks Rule.** Meaning on paper is carried only by highlighter (seen / the action), red pen (what sank it) and blue ballpoint (the fix). A new state that needs emphasis picks one of those three marks; it does not introduce a fourth colour.

**The One Yellow Action Rule.** Each view has one primary action and it is highlighter yellow with ink text. Second actions are outline on paper, `desk` outline on charcoal, or ink.

**The Verdict Colours Stay Put Rule.** Green appears only for `Shortlist` and success; ochre only for `Maybe` and `High`. Figures stay ink, or blue when they are a readiness gain on paper.

## Typography

**Display Font:** Newsreader (Google, optical sizes), via `next/font`, Georgia fallback. The `.display` and `.serif-display` classes both set it.
**Body Font:** Mona Sans
**Resume Font:** CMU Serif (self-hosted woff2 subset in `src/fonts/cmu`, 400 / 700 / 400 italic), with Latin Modern Roman and Georgia fallback

**Character:** One confident grotesque does every job, made heavy and a touch wide for headlines and condensed for figures, so the only typographic contrast on the page is the serif of the resume itself. The serif signals "this is your document"; the sans is Gapl talking.

### Hierarchy
- **Display** (Newsreader 400, -0.04 to -0.045em, line-height 0.95 to 1): every headline, landing and app. The `.display` class carries weight, width and tracking; size is set per use.
- **Headline** (780, clamp 2.25–3.75rem, 0.98): landing section heads ("Then it writes the fix back."), reading-page and status-screen titles (clamp to 4.5rem on status).
- **Page Title** (780, clamp 1.875–2.6rem): app page heads, the report head, analyze step questions.
- **Title** (600, 1.25rem, -0.015em): plan names, notice heads, empty-state titles.
- **Sheet Title** (600, 0.9375rem, -0.01em): the header of every paper sheet, with a tabular aside at 0.75rem.
- **Body** (400, 0.9375rem, 1.55–1.625): descriptions, remarks, FAQ answers, max 68ch. **Body Lead** (1.125rem, relaxed) sits under headlines.
- **Reading** (1.0625rem, 1.7, 68ch, h2 at 1.375rem / 750): long-form legal, about and blog columns.
- **Label** (700, 0.6875rem, 0.08em, uppercase): field labels inside paper such as "What caught the eye", "What sank it", "Build instead", table column heads (0.07em). Coloured by the mark they introduce.
- **Figure** (tabular, `wdth` 96, -0.02em, 600): every number. Readiness on the report face scales to clamp 3.25–4.5rem; the landing's readiness count to clamp 4–6rem.
- **Verdict** (750, `wdth` 110, 0.07em, uppercase): verdict words only; sizes sm 0.6875rem to xl clamp 1.5–2.25rem.
- **Resume** (CMU Serif, container-relative size): section heads in small caps over a 1px ink rule, bold entry titles, italic sub-lines.

### Named Rules
**The Serif Is the Resume Rule.** CMU Serif is used only for resume text: the SampleResume, the FixSection page and the CV preview. Never for Gapl's own headings, prose or UI.

**The No Monospace Costume Rule.** Codes, dates and figures are Mona Sans with tabular numerals and the `wdth` 96 cut, not a monospace face.

**The No Label Above a Heading Rule.** Headlines stand alone. Uppercase labels introduce values and rows inside paper; they never sit above a section heading as an eyebrow.

## Layout

The desk is laid out on a 12-column grid inside a 1280px container (`max-w-7xl`) with 16px gutters (24px from 640px). Landing sections alternate desk and paper bands, each 80px top and bottom (112px from 640px). Section heads sit left in 5–6 columns with the lead in a right-hand 5-column block, or above a full-width sheet. The hero is asymmetric: headline and drop zone in the left 6 columns, the sample resume page in the right 6, spanning both rows and cropped by the fold; below 1024px it stacks, and the sample is cropped to Education → Projects so the marked line fits a phone's first screen.

Content widths: report and app screens 1024px (`max-w-5xl`), reading pages 768px, the analyze sheet 672px, analyze notices 576px, the progress (reading) screen 512px. App screens use one frame: 16/24/32px side padding, 40px top on desktop (84px under the mobile bar), sheets stacked 20px apart. Inside paper, rows are hairline-ruled with 16px (sm 24px) side padding; figure strips divide into 2 then 3–4 columns. The sample resume sizes everything in container units (`cqw`) so its marks stay registered at any width.

Breakpoints are Tailwind's defaults (640, 768, 1024, 1280). The nav swaps links for a menu at 768px but keeps the yellow action visible on phones.

## Elevation & Depth

Depth is physical: paper lifting off a surface. There is no glass, no glow and no layered card stacks. A sheet on the charcoal desk casts a deep, dark page shadow; a sheet on the light pad casts a short card shadow; borders and shadows are not combined on the same card.

### Shadow Vocabulary
- **Page on desk** (`0 2px 3px 0 rgb(0 0 0 / 0.35), 0 30px 60px -28px rgb(0 0 0 / 0.75)`): every `.page`, and any `.sheet` placed on the desk.
- **Sheet on pad** (`0 1px 2px 0 rgb(22 23 27 / 0.06), 0 6px 18px -10px rgb(22 23 27 / 0.14)`): sheets and elevated cards on Operate screens.
- **Slip** (`0 18px 40px -12px rgb(22 23 27 / 0.2), 0 4px 8px -4px rgb(22 23 27 / 0.06)`): toasts, which are slips of white paper with a 1px rule.
- **Key press** (`0 1px 0 0 rgb(22 23 27 / 0.18), inset 0 -1px 0 0 rgb(22 23 27 / 0.12)`): the yellow primary button at rest; it drops 1px on press.
- **Small** (`0 1px 2px …`): the blank-page miniature in empty states.

### Named Rules
**The Two Materials Rule.** Every screen is desk with paper on it. The pad (`surface-muted`) is used only as the working ground of Operate screens (dashboard, CV builder, tailor) and for fills and hovers inside paper. Marketing, auth, analyze, report, demo, pricing, reading and status screens sit on the desk.

## Shapes

Paper is nearly square-cornered and controls are softly rounded. Sample and resume pages use 3–4px corners, wide report and pricing sheets 6px, app sheets, cards and option lists 10px, buttons 7 / 8 / 9px by size, inputs and chips 8px, the hero drop tray and analyze drop zone 12px. Tags are 4px, badges 5px, skill chips 6px. Progress tracks and step dots are full pills or circles.

Marks have their own geometry: highlight blocks are 1–3px-rounded rectangles cloned across line breaks; underlines and strikes are straight 2px rules (1.5px minimum, scaling with the page on the sample); the ring is a rounded rectangle (`999px / 40%`) revealed left to right by a clip; margin notes join their line with a short horizontal leader. The verdict box is tilted -2° to -3°, the one hand-set gesture in the system, and the auth panel's sample page sits at -1.5°.

## Components

### Buttons
Firm, flat and quick; one yellow per view.
- **Shape:** gently rounded (7px sm / 8px md / 9px lg), heights 36 / 40 / 48px, 600 weight, -0.005em.
- **Primary:** highlighter fill, ink text, key-press shadow; hover deepens to `highlight-deep`; press drops 1px; disabled turns `surface-subtle` with faint ink.
- **Secondary:** ink fill, white text; hover `ink-secondary`.
- **Outline:** paper with a `border-strong` edge that darkens to ink on hover. The second action on paper.
- **Desk:** transparent with a `desk-line` edge and light ink, hover `desk-raised`. The second action on charcoal ("See the sample report", "Sign in").
- **Ghost / Danger:** text-only with `surface-subtle` hover; red pen fill for destructive acts only.
- **Focus:** a 2px blue outline offset 2px on paper, a 2px yellow outline on the desk. All transitions 150ms ease-out.

### Verdict
- **Style:** the word itself (`Shortlist`, `Maybe`, `Reject`) uppercase in a box ruled 2px in its own colour (1.5px small, 3px at xl), 4px corners (6px at xl), no fill. An optional note follows a dot ("Reject · 6 sec").
- **Placement:** top of the report face at xl, tilted -2°; in the sample resume's margin at -3°.

### Tags and Chips
- **Tag:** 0.6875rem / 700 / uppercase / 0.06em, 4px corners, a 1px inset ring. Tones: Critical (red pen), High (ochre), Medium (neutral), Low (muted), fix (blue), highlight (`Next`).
- **Skill chips:** seen skills on soft highlighter; missing skills as red text ruled with `danger-border`, with "Missing:" for screen readers.
- **Choice chips:** 40px, 8px corners, paper with strong rule; selected is ink fill with yellow text.
- **Option list:** full-width radio rows on a 10px ruled sheet; the selected dot is ink with a yellow centre, and the chosen label is highlighted.

### Cards / Containers
- **Sheet:** the house container. Paper, 10px corners, overflow clipped, optional header (sheet title + tabular aside) over a hairline rule. Shadow by ground (see Elevation).
- **Page:** a resume-like sheet on the desk with the deep page shadow and 3–6px corners; used for the sample, the fix, the report face, pricing, the analyze flow and reading pages.
- **Card:** 10px; default (rule border), elevated (card shadow), flat (`surface-subtle`), bordered (ink border). One elevation cue, never both.
- **Figure strip:** a row of label / tabular figure / note cells divided by hairlines.
- **Empty state:** a miniature blank resume page (one line on soft highlighter), a title, a sentence and the next action.

### Inputs / Fields
- **Style:** paper, `border-strong` 1px, 8px corners, 44px tall, 0.9375rem; label above at 0.8125rem / 600.
- **Hover / Focus:** border to `ink-muted`; focus turns the border blue with a 3px blue ring at 20%.
- **Error / Disabled:** red border and ring, red message below with `role="alert"`; disabled at 50% on `surface-subtle`.
- **On the desk:** the hero's selects are 56px, `desk` fill, `desk-line` border, floating 11px label, focus border in highlighter.
- **Drop zones:** dashed 2px strong rule at 12px; active or filled turns ink-edged on soft highlighter.

### Navigation
- **Desk nav:** fixed 64px charcoal bar with a `desk-line` bottom rule; wordmark, three links (14px / 500, muted, hover to light ink on `desk-raised`), Sign in and a small yellow "Check my resume". Phones keep the yellow action and open a full-height desk menu (18px links ruled by `desk-line`).
- **Dashboard sidebar:** 240px charcoal column; a yellow "New analysis" button at the top, 40px links with 17px icons that turn yellow when active on `desk-raised`; a slide-in drawer below 768px under a 56px desk bar.
- **Step route:** ruled steps on paper; done circles ink with a yellow tick, the current circle highlighter with its label highlighted, the connector turning ink as steps complete.
- **Report tabs (mobile):** sticky on the desk, active tab underlined 2px in highlighter.
- **Footer:** desk, four columns, 14px muted links.

### Wordmark
"Gapl" in ink on a highlighter plate: 820 weight, `wdth` 112, -0.035em, 3px corners, 32px (28px small). The name is a highlighted word. The same plate appears in email headers.

### The Six-Second Read (signature)
SampleResume is a one-page LaTeX-style resume in CMU Serif on a page, with a reviewer's margin (24% column, hairline-ruled) and a top strip ("Recruiter's read", a 3px clock bar, "6 sec"). Marks play in reading order once the page is 40% in view (IntersectionObserver): highlight sweeps at 0.5–4.6s, a red underline under "Frameworks", a ring revealed around the coursework project, red margin notes ("No deployed project. No link, no users."), the clock filling over 6s, and `Reject` printing last at 5.5s. An inline script adds `html.js` before paint, so marks are held back only when JavaScript is present; without JS, under reduced motion, or with `animate={false}` (auth panel) the page arrives fully marked. "Read it again" replays it. A screen-reader caption states every mark.

### The Fix Written Back
FixSection is a page holding the struck coursework entry (a 2px red strike drawn over 700ms, text fading to muted), a red reason, then, below a dashed rule, a blue "Build instead" label and the route rows (when / build in blue / closes / `→ N` in blue), arriving one by one. Beside it on the desk, readiness counts 65 → 78 over 1.6s once in view (via `usePlayOnView`, 35% threshold, armed only when mounted below the fold). Static and complete without JS or under reduced motion.

### Report Face
The verdict at xl, the reason at 1.125–1.25rem, three remarks (label + mark: highlighted strongest signal, red-underlined top gap, blue fix), and a side column of readiness (hero figure), ATS score and an ink confidence bar. The readiness breakdown rules each component with an ink bar and marks the weakest in red pen with what pulls it down. The gaps table pairs the gap (ink) with the build (blue) and `readiness → N` (blue).

### Progress and Loading
Progress bars are 4–12px pills on `surface-subtle`, ink by default, red only for the weakest component. Loading is a highlighter bar sweeping a line (1.6s). Long work uses the reading screen: a page on the desk listing stages, done stages ticked and highlighted, the current one blinking.

### Email
`emailLayout()` frames every email: the pad as the outer ground, a 600px column with a charcoal header carrying the highlighted wordmark, a white paper body (15px, 1.6), and a muted footer line. The call to action is `emailButton()`: highlighter fill, ink text, 8px corners, 700 weight. Fixes in email are `primary-700` blue, problems red pen.

## Do's and Don'ts

### Do:
- **Do** put every screen on the desk with paper on it; use the pad only under dashboard, CV builder and tailor.
- **Do** give each view exactly one highlighter-yellow action, with ink text.
- **Do** write verdicts as words in a ruled box (`.verdict` / VerdictBadge), coloured by the pen that wrote them.
- **Do** mark what was seen with highlighter, what sank it with red pen, and the fix with blue ballpoint (`primary-700` on paper).
- **Do** use `danger-on-desk` for any red text on charcoal, and a yellow focus outline on the desk.
- **Do** set every number as a figure: Mona Sans, tabular, `wdth` 96.
- **Do** size the hero highlight to the letters (`background-size: 100% 80%`, positioned at 72%) so it never covers the line above.
- **Do** let marks draw on with ease-out-expo, once, when in view; and make the finished, fully marked state the no-JS and reduced-motion default.

### Don't:
- **Don't** use green or ochre for figures, bars or scores; green is the Shortlist word and success, ochre is Maybe and High.
- **Don't** signal a verdict or priority by colour alone.
- **Don't** set Gapl's own words in CMU Serif, or dress data in a monospace face.
- **Don't** put an uppercase label or eyebrow above a heading.
- **Don't** fill a primary button with blue or red; blue is the fix and links, red is what sank it and destructive acts.
- **Don't** draw marks hand-wobbly or sketchy; they are straight rules, crisp blocks and a clean ring.
- **Don't** use the pad as a marketing, auth, analyze or report ground, or stack a border and a shadow on one card.
- **Don't** bounce, spring or loop motion on content; the only loops are the loading sweep and the current-stage blink.
