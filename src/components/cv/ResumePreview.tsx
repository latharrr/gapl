"use client";

import { Mail, Phone, MapPin, Link2 } from "lucide-react";

export interface CVData {
  name: string;
  phone: string;
  location: string;
  email: string;
  linkedin: string;
  github: string;
  objective: string;
  education: { degree: string; institution: string; year: string; coursework: string }[];
  skills: { category: string; items: string }[];
  experience: { role: string; company: string; location: string; duration: string; bullets: string[] }[];
  projects: { name: string; description: string }[];
  activities: string[];
  atsScore: number;
  originalAtsScore: number;
  keywordsInjected: string[];
  bulletsImproved: number;
  topWin: string;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 style={{
        fontSize: "10.5pt", fontWeight: 700, borderBottom: "1.5px solid #111",
        paddingBottom: "2px", marginBottom: "6px", letterSpacing: "0.06em",
        textTransform: "uppercase" as const,
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

export function ResumePreview({ cv }: { cv: CVData }) {
  return (
    <div style={{ fontFamily: "'Times New Roman', serif", fontSize: "10.5pt", lineHeight: 1.45, color: "#111" }}>
      {/* Header */}
      <div style={{ textAlign: "center", borderBottom: "2px solid #111", paddingBottom: "10px", marginBottom: "14px" }}>
        <div style={{ fontSize: "19pt", fontWeight: 700, letterSpacing: "0.04em", marginBottom: "5px" }}>{cv.name}</div>
        <div style={{ display: "flex", flexWrap: "wrap" as const, justifyContent: "center", gap: "16px", fontSize: "9pt", color: "#444" }}>
          {cv.phone && <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><Phone size={9} />{cv.phone}</span>}
          {cv.location && <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><MapPin size={9} />{cv.location}</span>}
          {cv.email && <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><Mail size={9} />{cv.email}</span>}
          {cv.linkedin && <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><Link2 size={9} />{cv.linkedin.replace("https://", "")}</span>}
          {cv.github && <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><Link2 size={9} />{cv.github.replace("https://", "")}</span>}
        </div>
      </div>

      {cv.objective && (
        <Section title="Objective">
          <p style={{ fontSize: "10pt", color: "#222" }}>{cv.objective}</p>
        </Section>
      )}

      {cv.education?.length > 0 && (
        <Section title="Education">
          {cv.education.map((ed, i) => (
            <div key={i} style={{ marginBottom: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700 }}>{ed.degree}</span>
                <span style={{ color: "#555" }}>{ed.year}</span>
              </div>
              <div style={{ color: "#444", fontSize: "10pt" }}>{ed.institution}</div>
              {ed.coursework && <div style={{ fontSize: "9.5pt", color: "#666", marginTop: "2px" }}>Relevant Coursework: {ed.coursework}</div>}
            </div>
          ))}
        </Section>
      )}

      {cv.skills?.length > 0 && (
        <Section title="Skills">
          {/* Plain "Label: items" lines; tables are a common ATS parsing failure. */}
          {cv.skills.map((s, i) => (
            <p key={i} style={{ fontSize: "10pt", marginBottom: "3px", color: "#333" }}>
              <strong style={{ color: "#111" }}>{s.category}:</strong> {s.items}
            </p>
          ))}
        </Section>
      )}

      {cv.experience?.length > 0 && (
        <Section title="Experience">
          {cv.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700 }}>{exp.role}</span>
                <span style={{ color: "#555", fontSize: "10pt" }}>{exp.duration}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10pt" }}>
                <span style={{ color: "#444" }}>{exp.company}</span>
                <span style={{ color: "#555", fontStyle: "italic" }}>{exp.location}</span>
              </div>
              <ul style={{ margin: "4px 0 0 18px", padding: 0 }}>
                {exp.bullets.map((b, j) => (
                  <li key={j} style={{ fontSize: "10pt", color: "#333", marginBottom: "2px" }}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {cv.projects?.length > 0 && (
        <Section title="Projects">
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {cv.projects.map((p, i) => (
              <li key={i} style={{ marginBottom: "5px", fontSize: "10pt" }}>
                <span style={{ fontWeight: 700 }}>{p.name}. </span>
                <span style={{ color: "#333" }}>{p.description}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {cv.activities?.length > 0 && (
        <Section title="Extra-Curricular Activities">
          <ul style={{ margin: "0 0 0 18px", padding: 0 }}>
            {cv.activities.map((a, i) => <li key={i} style={{ fontSize: "10pt", color: "#333", marginBottom: "2px" }}>{a}</li>)}
          </ul>
        </Section>
      )}
    </div>
  );
}

/**
 * Print styles for a page that renders its CV inside `#cv-print-target`.
 *
 * The target stays in normal document flow so a long CV continues onto page 2
 * (a `position: fixed` target prints on one page only and drops the rest).
 * `@page { margin: 0 }` keeps browser URL/date headers off the PDF; the cloned
 * padding gives every page, not just the first, its 0.5in margin.
 */
export const CV_PRINT_CSS = `
  @media print {
    html, body { background: white !important; }
    body * { visibility: hidden; }
    #cv-print-target, #cv-print-target * { visibility: visible; }
    #cv-print-target {
      display: block !important;
      position: static;
      padding: 0.5in;
      -webkit-box-decoration-break: clone;
      box-decoration-break: clone;
      background: white;
      font-family: 'Times New Roman', serif;
    }
    #cv-print-target h2 { break-after: avoid; }
    #cv-print-target li, #cv-print-target p { break-inside: avoid; }
    @page { margin: 0; size: A4; }
  }
`;
