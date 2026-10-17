---
name: Gapl
description: Application readiness for placement season, printed as an Indian Railways reservation chart.
colors:
  ink: "#17181f"
  ink-secondary: "#383b47"
  ink-muted: "#595c69"
  ink-faint: "#8a8c96"
  surface: "#fcfcf7"
  surface-muted: "#f0f0e8"
  surface-subtle: "#e6e6dc"
  border: "#d2d1c4"
  border-strong: "#a9a89a"
  primary: "#1d2b6b"
  primary-foreground: "#fcfcf7"
  primary-50: "#eceef6"
  primary-100: "#d8dcee"
  primary-400: "#6676bd"
  primary-500: "#2d3d8c"
  primary-700: "#131d4f"
  primary-900: "#0c1236"
  board: "#f5c518"
  board-deep: "#e2b106"
  board-ink: "#14140f"
  led: "#ffb01f"
  led-dim: "#4a3a17"
  led-ground: "#141412"
  greenbar: "#e3ecdc"
  success: "#1d7337"
  success-bg: "#e3efe3"
  success-border: "#a9cfb1"
  warning: "#8f5300"
  warning-bg: "#f8edd4"
  warning-border: "#e3c483"
  danger: "#b0241c"
  danger-bg: "#f6e1dd"
  danger-border: "#e4aea7"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2.4rem, 6.4vw, 5.6rem)"
    fontWeight: 850
    lineHeight: 0.98
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 94"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4.2vw, 3.5rem)"
    fontWeight: 850
    lineHeight: 0.98
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 94"
  page-title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4.5vw, 3rem)"
    fontWeight: 850
    lineHeight: 0.98
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 94"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  sheet-title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "0.06em"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.625
  body-lead:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  button:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    letterSpacing: "-0.005em"
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1rem
    letterSpacing: "0.07em"
  data:
    fontFamily: "Martian Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    letterSpacing: "0"
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 85"
  data-figure:
    fontFamily: "Martian Mono, ui-monospace, monospace"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 85"
  stamp:
    fontFamily: "Martian Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.02em"
    fontVariation: "'wdth' 85"
  led:
    fontFamily: "Doto, ui-monospace, monospace"
    fontSize: "1.05rem"
    fontWeight: 900
    letterSpacing: "0.04em"
rounded:
  tag: "2px"
  stamp: "3px"
  plate: "4px"
  control: "5px"
  sheet: "6px"
  dot: "9999px"
spacing:
  gutter-mobile: "16px"
  gutter: "24px"
  block: "12px"
  row-y: "14px"
  row-x: "24px"
  stack: "20px"
  section-mobile: "64px"
  section: "96px"
  rail-offset: "59px"
components:
  button-primary:
    backgroundColor: "{colors.board}"
    textColor: "{colors.board-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.board-deep}"
    textColor: "{colors.board-ink}"
  button-primary-lg:
    backgroundColor: "{colors.board}"
    textColor: "{colors.board-ink}"
    rounded: "{rounded.sheet}"
    padding: "0 24px"
    height: "48px"
  button-secondary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.primary-700}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-ghost:
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
  enquiry-select:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 40px 0 12px"
    height: "48px"
  enquiry-strip:
    backgroundColor: "{colors.primary}"
    rounded: "{rounded.sheet}"
    padding: "16px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.sheet}"
    padding: "24px"
  chart-sheet:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.sheet}"
  sheet-header:
    typography: "{typography.sheet-title}"
    textColor: "{colors.ink}"
    padding: "12px 24px"
  chart-row:
    backgroundColor: "{colors.surface}"
    padding: "14px 24px"
  chart-row-even:
    backgroundColor: "{colors.greenbar}"
    padding: "14px 24px"
  stamp-cnf:
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.success}"
    typography: "{typography.stamp}"
    rounded: "{rounded.stamp}"
    padding: "0.15em 0.5em"
  stamp-rac:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning}"
    typography: "{typography.stamp}"
    rounded: "{rounded.stamp}"
    padding: "0.15em 0.5em"
  stamp-wl:
    backgroundColor: "{colors.danger-bg}"
    textColor: "{colors.danger}"
    typography: "{typography.stamp}"
    rounded: "{rounded.stamp}"
    padding: "0.15em 0.5em"
  stamp-neutral:
    textColor: "{colors.ink}"
    typography: "{typography.stamp}"
    rounded: "{rounded.stamp}"
    padding: "0.15em 0.5em"
  badge:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.stamp}"
    padding: "2px 6px"
  signboard:
    backgroundColor: "{colors.board}"
    textColor: "{colors.board-ink}"
    typography: "{typography.display}"
    rounded: "{rounded.sheet}"
    padding: "32px 40px 24px"
  wordmark:
    backgroundColor: "{colors.board}"
    textColor: "{colors.board-ink}"
    rounded: "{rounded.plate}"
    padding: "0 14px"
    height: "32px"
  led-board:
    backgroundColor: "{colors.led-ground}"
    textColor: "{colors.led}"
    typography: "{typography.led}"
    rounded: "{rounded.plate}"
    padding: "0 16px"
    height: "44px"
  rail-bar:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    height: "56px"
    padding: "0 24px"
  nav-link:
    textColor: "{colors.primary-100}"
    rounded: "{rounded.plate}"
    padding: "6px 12px"
  nav-link-active:
    textColor: "{colors.board}"
  progress-track:
    backgroundColor: "{colors.surface-subtle}"
    rounded: "{rounded.tag}"
    height: "8px"
  progress-fill:
    backgroundColor: "{colors.primary}"
    rounded: "{rounded.tag}"
---

# Design System: Gapl

## Overview

**Creative North Star: "The Reservation Chart"**

Gapl reads like a reservation chart pasted up on a platform: a pale chart-paper ground, rows banded in greenbar stationery, rail-navy ink for structure, a yellow station nameboard for the headline and the one action that matters, and an amber dot-matrix departure board for anything live. Readiness is a reservation status. Every candidate gets a row on the chart, and the verdict is printed in that row as a status stamp: WL for Reject, RAC for Maybe, CNF for Shortlist. The remark that explains it is printed next to it.

The density is that of printed stationery. Information sits in ruled sheets with a header rule, column headers and banded rows, not in floating cards. Display type is heavy and a little narrow, the way station signage is. Figures are set in a narrow monospace so they line up in columns. Three materials make up every screen: paper, navy and LED. A section commits to one of them for its full width, so there are no grey template bands between them. Motion follows the signage too: LED messages roll up one line at a time, stages blink from WAIT to NOW to DONE, and a marker runs down the route. Under reduced motion all of it becomes static or a crossfade.

The world sets itself against the generic AI SaaS look (indigo gradients, sparkle badges, glass, icon-card grids), against gamified products (confetti, mascots, streaks) and against the grey of a corporate HR tool. Its colour comes from railway materials. Nothing in it is decorative chrome.

**Key Characteristics:**
- Three materials: chart paper (light), rail navy (structure), LED board (live and dark).
- Station-board yellow is reserved for the primary action, the wordmark and the headline plate.
- Status is always written out as a code plus a word (`WL 3 / Reject`) and never shown by colour alone.
- Data is printed in ruled sheets: a header over a 1.5px ink rule, uppercase column headers, and greenbar bands on even rows.
- Every number sits next to its reason, joined by a leader line or an adjacent remark.
- Square-ish corners (2–6px), one elevation cue per surface, and no gradients or blur.

## Colors

The palette is railway material rather than brand decoration: warm chart paper, blue-tinted ink, coach-livery navy, signboard yellow, LED amber, and three status inks borrowed from a reservation slip.

Tailwind v4 note: tokens live in `src/app/globals.css` under `@theme`. Default steps keep a literal `-DEFAULT` suffix in their utility names (`bg-surface-DEFAULT`, `border-border-DEFAULT`, `--color-primary-DEFAULT`), and navy is used through its numbered step (`bg-primary-600`, which has the same value as `primary`). `tailwind.config.ts` is legacy and is not loaded, so it is not a token source.

### Primary
- **Rail Navy** (`primary`, also `primary-600`): the structure colour. It covers the rail bar nav, the PNR enquiry strip, the auth side panel, the dashboard sidebar, the footer, the secondary button, the share slip, link text, focus rings, the caret and neutral progress fills. It is the theme colour of the browser chrome.
- **Navy ramp** (`primary-50` → `primary-900`): `primary-50/100` for tints and for the muted text of nav links on navy, `primary-400` for inactive sidebar icons and the "You" tag outline, `primary-700` for hover states on navy surfaces, and `primary-900` at 50% for the drawer scrim.

### Secondary
- **Station-Board Yellow** (`board`): the action and signage colour. It fills the primary button, the wordmark plate, the hero headline plate, the selected radio dot and the "Next" flag stamp. It is also the 3px rule under or beside every navy surface, and the label text on navy (enquiry field labels, footer column heads, share-slip labels). The text selection highlight uses it too.
- **Board Deep** (`board-deep`): hover state of the yellow button.
- **Board Ink** (`board-ink`): near-black type and rim on yellow plates.

### Tertiary
- **LED Amber** (`led`): dot-matrix type on the departure board, the lit route track and passed stops.
- **Unlit Dot** (`led-dim`): the unlit track, borders inside the LED board, the separator after the board's tag.
- **Board Ground** (`led-ground`): the black ground of the LED sections (route, final CTA, loading screen, demo banner), printed with a 5px amber dot grid at 7%.

### Status
- **CNF Green** (`success` / `success-bg` / `success-border`): Shortlist, confirmed. It also marks strengths ("Strongest signal", "+" skills), completed ticks and readiness after a build.
- **RAC Ochre** (`warning` / `warning-bg` / `warning-border`): Maybe, RAC. It also marks High priority gaps and the "one analysis left" stamp.
- **WL Red** (`danger` / `danger-bg` / `danger-border`): Reject, waitlisted. It also marks Critical gaps, the weakest readiness component and its leader-line note, errors, and "Top gap".

### Neutral
- **Rail Ink** (`ink`): body text and headlines on paper, the 1.5px rule under sheet headers, the bordered card outline, the done steps on the analyze route strip.
- **Ink Secondary / Muted / Faint** (`ink-secondary`, `ink-muted`, `ink-faint`): prose, then metadata and column headers, then placeholders, empty cells (`—`) and the unfilled "Your role" row. All are blue-tinted greys, never neutral zinc.
- **Chart Paper** (`surface`): sheets, cards, inputs, selects.
- **Platform Ground** (`surface-muted`): the page background behind sheets, and the light text colour on LED sections.
- **Pasted Backing** (`surface-subtle`): progress tracks, flat cards, ghost-button hover.
- **Greenbar** (`greenbar`): even rows of any `chart-rows` list.
- **Rule** (`border`, `border-strong`): row dividers, then stronger outlines on outline buttons, inputs and chips.

### Named Rules
**The Written Status Rule.** A status is never shown by colour alone. A verdict stamp always prints its code, a slash and the verdict word (`CNF / Shortlist`, `RAC / Maybe`, `WL 3 / Reject`), and the WL number is the count of Critical and High gaps between the resume and a shortlist. Priority stamps print their word (`Critical`, `High`). A coloured bar or note is always paired with text that names it.

**The Three Grounds Rule.** A full-width section is paper (`surface-muted`), navy (`primary`) or LED (`led-ground`). There are no grey or tinted template bands between them.

**The Yellow Is The Action Rule.** Yellow fills only the primary action, the wordmark and the headline plate, and on navy or LED grounds it is also the rule colour and label colour. Yellow is never used as text on paper.

## Typography

**Display Font:** Archivo (variable, `wdth` axis), with system-ui
**Body Font:** Archivo
**Data Font:** Martian Mono (variable, `wdth` axis), with ui-monospace
**LED Font:** Doto (700/900), with ui-monospace

**Character:** A heavy, slightly condensed grotesque reads like a station nameboard. A narrow monospace prints the chart figures in aligned columns, and a dot-matrix face appears only where a departure board would light up. The three faces never trade jobs.

### Hierarchy
- **Display** (850, wdth 94, `clamp(2.4rem, 6.4vw, 5.6rem)`, line-height 0.98): the hero headline on the signboard. One per page.
- **Headline** (850, wdth 94, `clamp(2rem, 4.2vw, 3.5rem)`): section titles on landing, pricing and FAQ. The closing CTA scales up to `clamp(2.4rem, 5.6vw, 4.75rem)`.
- **Page Title** (850, wdth 94, `clamp(2rem, 4.5vw, 3rem)`): app page heads ("Your chart", "Your status", "Sample report"). Analyze step questions use `clamp(1.9rem, 5vw, 2.6rem)`.
- **Title** (800, 1.25rem, -0.015em): plan names, empty-state heads, the role in a chart row (up to 1.5rem).
- **Sheet Title** (800, 0.875rem, uppercase, 0.06em): the header of every chart sheet ("Reservation chart", "Recruiter's remark").
- **Body** (400, 0.9375rem, line-height 1.625): remarks, descriptions, FAQ answers, capped at 62–68ch. Lead paragraphs under headlines use **Body Lead** (1.125rem).
- **Label** (700, 0.6875rem, uppercase, 0.07em): column headers, field labels on navy, `dt` terms such as "Strongest signal" (0.75rem, 0.08em when standing alone).
- **Data** (Martian Mono, wdth 85, tabular figures): every figure, code, date, week count, plan fare and sheet annotation. Figures scale from 0.75rem in annotations, to 1.125–1.5rem in rows, to 2.25rem for the row's headline readiness, to `clamp(6rem, 14vw, 10rem)` for the single giant number in a viewport.
- **Stamp** (Martian Mono 700, uppercase, 0.02em, 0.6875–1rem): status, priority and code stamps.
- **LED** (Doto 900, uppercase, 0.04–0.06em, 0.95–1.05rem; readouts up to `clamp(3rem, 7vw, 4.75rem)`): departure-board messages, loading stages, route readouts.

### Named Rules
**The One Face Per Job Rule.** Archivo is the voice: headlines, prose, buttons, labels. Martian Mono is for chart data only: figures, codes, stamps and short printed annotations, never headlines or paragraphs. Doto is for the LED board only, always uppercase, on `led-ground` or black.

**The One Giant Rule.** Each viewport gets one jump to giant scale: the signboard headline, the readiness numeral, or the route readout. Everything else stays in the hierarchy above.

## Layout

The spatial model is a printed chart. Content sits in full-width sections (`section` 96px vertical padding, 64px on mobile) inside a centred container. That container is 1280px (`max-w-7xl`) for marketing pages, 1024px (`max-w-5xl`) for report, demo and dashboard, and 576px (`max-w-xl`) for the analyze steps. Side gutters are 16px, rising to 24px from `sm`.

- **Fixed rail bar:** the nav is 56px of navy plus a 3px yellow rule. Pages offset by 59px (`rail-offset`), and sticky elements dock at `top-[59px]`.
- **Section grid:** at `lg`, a title column and a sheet column share the row, at 4fr/8fr (How it works, Codes, Enquiry, Remarks) or 5fr/7fr (Route, where the title column is sticky at `top-24`). The recruiter remark splits 7fr/5fr with a rule between. Below `lg` everything stacks.
- **Chart rows:** at `md` and up, rows use a fixed column template with an `aria-hidden` header row (No., Applying for, Tier, ATS, Readiness, Status, Remarks). Below `md`, each row collapses to a two-column grid: the role and tier take full width, and each figure carries its own inline label (the label is `md:sr-only`). Row padding is 14–20px vertical and 16/24px horizontal.
- **Stacks:** report sheets stack with a 20px gap (`stack`). Hero blocks (signboard, enquiry strip, chart, LED strip) sit 12px apart (`block`), so they read as one platform assembly.
- **Breakpoints:** `sm` 640px (gutters, padding), `md` 768px (desktop nav, chart columns, sidebar), `lg` 1024px (two-column sections, auth split).
- **Phone first:** the report must read at 360px. Mobile report navigation is a sticky tab strip under the rail bar (3px ink underline on the active tab). The auth navy half is replaced below `lg` by a compact navy rail bar. The dashboard sidebar becomes a slide-in drawer.

## Elevation & Depth

Depth is paper on paper. Sheets lift off the platform ground with one short, soft shadow, and everything else is flat and separated by rules, bands and material changes (paper to navy to LED). Shadows are ink-tinted (`rgb(23 24 31 / …)`), short and never glowing.

### Shadow Vocabulary
- **Sheet** (`box-shadow: 0 1px 2px 0 rgb(23 24 31 / 0.08), 0 4px 14px -6px rgb(23 24 31 / 0.12)`): every chart sheet and elevated card.
- **Button rest** (`box-shadow: 0 1px 2px 0 rgb(23 24 31 / 0.08), 0 1px 1px -1px rgb(23 24 31 / 0.05)`): the yellow primary button at rest.
- **Button hover** (`box-shadow: 0 6px 16px -4px rgb(23 24 31 / 0.14), 0 2px 4px -2px rgb(23 24 31 / 0.06)`): the yellow primary on hover, and the mobile sidebar toggle.
- **Drop** (`box-shadow: 0 14px 32px -8px rgb(23 24 31 / 0.18), 0 4px 8px -4px rgb(23 24 31 / 0.06)`): the mobile nav menu that drops from the rail bar.

### Named Rules
**The One Cue Rule.** A card gets either a border or a shadow, never both. `default` is bordered, `elevated` is shadowed, `flat` is a backing tint, and `bordered` is a 1.5px ink outline.

**The Signboard Rim Rule.** The yellow plate's depth is a printed frame rather than a shadow: a 3px `board-ink` border, a 5px inset yellow margin and a 1px inset ink line (2px/1px on the small plate), with at most a 2px soft ground line beneath.

## Shapes

Corners stay nearly square, the way stationery and enamel plates are. They step up with the size of the object: 2px for tags and progress bars, 3px for stamps, badges and chips, 4px for the small plate, LED strips, nav links and small buttons, 5px for medium buttons and inputs, and 6px for sheets, cards, signboards and large buttons. Full circles appear only as route stops and step dots, where they stand for stations. Rules carry the structure: a 1.5px ink rule under every sheet header, 1px `border` dividers between rows, dashed rules for leader lines and card footers, and 3px yellow rules on every navy edge. The pending state is drawn as a dashed stamp outline ("Not charted").

## Components

### Buttons
Buttons are tactile and plain, like a pressed enamel plate.
- **Shape:** 4px (sm, 32px tall), 5px (md, 40px), 6px (lg, 48px).
- **Primary:** a station-board yellow fill with near-black text and a 2px `board-ink` border, carrying the Button rest shadow. It is the one action per view ("Check my status", "New analysis").
- **Hover / Focus / Active:** the fill deepens to `board-deep` with the hover shadow, transitioning colour, shadow and transform over 150ms ease-out. Focus is a 2px navy outline at a 2px offset. Pressing drops the button 1px (`translate-y-px`). Disabled sits at 45% opacity.
- **Secondary:** navy fill with a 2px navy border and a paper label, hovering to `primary-700`.
- **Outline:** a paper fill with a 1.5px `border-strong` outline that hovers to ink, for the second choice beside a yellow primary (non-recommended fares, "Download").
- **Ghost:** `ink-secondary` text that hovers to a `surface-subtle` backing.
- **Danger:** a WL red fill with white text, for destructive acts only.
- **On LED or navy grounds:** a secondary link is a 1.5px outline in paper at 30%, rising to 70% on hover.

### Status Stamps (signature)
These are the reservation-slip stamps that carry the system's meaning.
- **Style:** Martian Mono 700, uppercase, 1.5px `currentColor` border, 3px radius, tinted fill (`stamp`).
- **Verdicts:** `VerdictBadge` prints `CODE / Verdict`, with the slash at 50% opacity: CNF / Shortlist (green), RAC / Maybe (ochre), WL n / Reject (red). It comes in sm, md and lg sizes, and on navy it sits on a paper fill.
- **Other stamps:** priority (`Critical` red, `High` ochre, `Medium`/`Low` neutral), legend codes (`ATS`, `6 SEC`, `GAP`, `ROUTE`) in ink, `Recommended` and `Next` on yellow with an ink border, and a dashed muted `Not charted` for empty rows.

### Chips (skill tags and badges)
- **Skill chip:** Martian Mono 0.75rem with a 1px `border-strong` outline, 3px radius and paper fill, prefixed by a coloured `+` or `−` mark that repeats the column's written heading.
- **Badge:** Archivo 600, 0.6875–0.75rem, 3px radius, a tinted fill with a matching border, in default, primary, success, warning, danger and outline variants.
- **Row tags:** a 0.625rem mono uppercase tag with a 2px radius ("Sample" in muted ink, "You" in navy).

### Cards / Containers
- **Chart Sheet:** the default container for data. It has a paper fill, the Sheet shadow and a 6px radius with clipped overflow. The header row holds an uppercase Sheet Title on the left and a mono annotation on the right, over a 1.5px ink rule. Rows below are divided by 1px rules or banded with greenbar on even children.
- **Card:** 6px radius on a paper fill, in four variants (see The One Cue Rule). Padding is 16px (sm), 20→24px (md) or 24→32px (lg). The footer sits under a dashed `border-strong` rule.
- **Share slip:** a navy sheet with `border-white/15` rules, yellow uppercase labels and paper text.

### Inputs / Fields
- **Style:** 44px tall, paper fill, 1.5px `border-strong` stroke, 5px radius, 0.9375rem text, label in Archivo 600 0.8125rem `ink-secondary`.
- **Focus:** the border turns navy and a 3px navy ring at 15% appears.
- **Hover:** the border darkens to `ink-muted`.
- **Error:** a red border with a red ring at 20%, and a red message announced via `role="alert"`. **Disabled:** 50% opacity on the `surface-subtle` fill.
- **Enquiry select (on navy):** 48px tall, paper fill, a 2px transparent border that turns yellow on focus, a yellow uppercase label above, and a chevron at the right.
- **Option list (analyze):** a chart sheet of radio rows. The selected row takes a yellow 30% band and an ink-filled radio with a yellow centre dot.
- **Textarea:** same stroke, ring and radius as the input, at 6px.

### Navigation
- **Rail bar:** a fixed navy bar, 56px tall, with a 3px yellow rule beneath. It holds the wordmark at left and Archivo 500 0.875rem links in `primary-100`, which hover to white on a white 10% backing. The active link turns yellow. A yellow small primary button sits at right.
- **Mobile:** a menu toggle opens a navy panel that drops from 59px (opacity and 6px rise, 180ms, ease-out-expo, Drop shadow) with full-width links and a large yellow button.
- **Dashboard sidebar:** a 240px navy column with a 3px yellow right rule. Items are 40px rows with a 4px radius. The active item gets a white 12% backing and a yellow icon. A yellow "New analysis" button sits on top. On mobile it becomes a 256px drawer that slides from the left (300ms, ease-out-expo) over a navy 50% scrim.
- **Analyze route strip:** four steps on a paper bar. Done steps show an ink dot with a tick, the current step a yellow dot with an ink rim, and later steps an outlined dot, joined by a 3px track.
- **Footer:** a navy ground with a 3px yellow top rule and yellow uppercase column heads.

### Signboard and Wordmark (signature)
The wordmark is "Gapl" set as a station nameboard: a yellow plate with a black rim and Archivo 850. It is 32px tall (28px small). The full `signboard` carries the hero headline at Display scale over a short uppercase line of what the report contains.

### LED Departure Board (signature)
A `led-ground` strip with the amber dot grid and Doto 900 amber caps. It can lead with a fixed tag ("GAPL") divided by a `led-dim` rule. Messages roll up one at a time every 4.2s (2.8s in the closing CTA), and the full message set is always present as `sr-only` text. It is used for live, rolling and loading states: the hero strip, the demo banner ("SAMPLE · NOT A REAL CANDIDATE"), empty states ("NO CHART PREPARED YET"), plan limits, the analysis loader (stages read WAIT → NOW → DONE, with NOW blinking), and roadmap progress readouts.

### Leader-Line Breakdown (signature)
Each readiness component is a row with its name, a mono `score/100`, a 10px progress bar, a dashed leader line and the reason at the right. The weakest component turns red, along with its bar, score and note, and the note is prefixed "Pulled down most by:". The same leader-line form carries remarks on the landing page.

### Route (signature)
The roadmap is set as a train schedule. On the landing page, a 3px track runs down LED stops. As the reader scrolls, the amber fill grows (spring: stiffness 140, damping 28, mass 0.4), passed stops light up (300ms colour transition), and a sticky readout states the current stop and status, stepping WL 3 → WL 2 → WL 1 → RAC. In the report, weeks hang off a 2px rule. Week state is a mark: an outlined dot, or a green dot with a tick when complete. Tasks use a 3px-radius checkbox, and the next task carries a yellow `Next` flag stamp.

### Motion
One curve runs the whole system, `ease-out-expo` (`cubic-bezier(0.16, 1, 0.3, 1)`), with 150ms colour transitions on controls. Step changes in analyze fade with an 8px rise over 250ms. FAQ answers open over 280ms while the plus rotates 45° over 300ms. LED messages roll in 450ms. Progress widths ease over 700ms. The LED blink is a two-step 1.1s hard toggle, a lamp rather than a fade.

**The Static Under Reduced Motion Rule.** Under `prefers-reduced-motion: reduce`, every CSS animation and transition is clamped to 0.01ms with one iteration, and smooth scrolling is off. The LED board swaps its roll for an instant crossfade. The route track renders fully lit and stops scrubbing. No information is carried by motion alone.

## Do's and Don'ts

### Do:
- **Do** write every status out as code plus word (`CNF / Shortlist`, `RAC / Maybe`, `WL 3 / Reject`), and keep WL red, RAC ochre and CNF green bound to those meanings.
- **Do** put data in a chart sheet: an uppercase Sheet Title, a mono annotation and a 1.5px ink rule, then column headers in the Label style and greenbar bands on even rows.
- **Do** set every number in Martian Mono with tabular figures, and print its reason beside it with a leader line or remark.
- **Do** commit each full-width section to paper, navy or LED, and put a 3px yellow rule on the edge of every navy surface.
- **Do** keep station-board yellow for the one primary action per view, the wordmark and the headline plate.
- **Do** mark progress and state with a shape (tick, lit dot, flag, dashed stamp), not a hue alone.
- **Do** mirror every LED message in screen-reader text or an `aria-live` region.
- **Do** keep corners between 2px and 6px, and reserve circles for stops and step dots.
- **Do** collapse chart columns below 768px into two-column rows with inline labels, so a report reads at 360px.

### Don't:
- **Don't** show a status, priority or strength by colour alone. No unlabelled dots, tinted rows or coloured bars without words.
- **Don't** use Martian Mono for headlines or prose paragraphs, or Doto anywhere outside an LED board.
- **Don't** use neutral zinc, slate or gray. Greys here are blue-tinted ink on warm chart paper.
- **Don't** use gradients, glass blur, glows or pill-shaped buttons.
- **Don't** give a card both a border and a shadow.
- **Don't** set yellow text on paper. Yellow is a fill, or text only on navy and LED grounds.
- **Don't** put an uppercase eyebrow above a headline. Uppercase is for sheet titles, column headers, field labels and `dt` terms.
- **Don't** add confetti, mascots, streaks or sparkle badges. The product is not gamified.
