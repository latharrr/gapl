const str = (v: unknown, max = 1000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const objs = (v: unknown, max: number) =>
  Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x)).slice(0, max) : [];
const strs = (v: unknown, max: number) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, max).map((x) => x.trim().slice(0, 500)) : [];
const score = (v: unknown, label: string) => {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`CV result has an invalid ${label}.`);
  return Math.min(100, Math.max(0, Math.round(n)));
};

/**
 * Checks the AI's CV-builder JSON and fills every field the CV builder page and
 * preview read, so a missing field can't show NaN scores or crash the page after
 * a credit was taken. Throws when the essentials (name, scores) are missing so
 * the caller refunds the credit.
 */
export function validateCvResult(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("CV result is missing.");
  const r = payload as Record<string, unknown>;
  const name = str(r.name, 120);
  if (!name) throw new Error("CV result is missing a name.");

  return {
    name,
    phone: str(r.phone, 60),
    location: str(r.location, 120),
    email: str(r.email, 200),
    linkedin: str(r.linkedin, 300),
    github: str(r.github, 300),
    objective: str(r.objective, 600),
    education: objs(r.education, 10).map((e) => ({ degree: str(e.degree), institution: str(e.institution), year: str(e.year, 40), coursework: str(e.coursework) })),
    skills: objs(r.skills, 15).map((s) => ({ category: str(s.category, 100), items: str(s.items) })),
    experience: objs(r.experience, 15).map((e) => ({
      role: str(e.role), company: str(e.company), location: str(e.location), duration: str(e.duration, 80), bullets: strs(e.bullets, 10),
    })),
    projects: objs(r.projects, 15).map((p) => ({ name: str(p.name), description: str(p.description, 1500) })),
    activities: strs(r.activities, 15),
    atsScore: score(r.atsScore, "ATS score"),
    originalAtsScore: score(r.originalAtsScore, "original ATS score"),
    keywordsInjected: strs(r.keywordsInjected, 15),
    bulletsImproved: Math.max(0, Math.min(200, Math.round(Number(r.bulletsImproved) || 0))),
    topWin: str(r.topWin, 400),
  };
}
