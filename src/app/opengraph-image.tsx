import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Gapl — Six seconds. Here's what they saw.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social share card: the headline on the desk, the second sentence highlighted, the verdict in red pen.
export default async function OpengraphImage() {
  // Mona Sans (OFL); process.cwd() is the project root.
  const [heavy, regular] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/mona-sans-latin-800-normal.woff")),
    readFile(join(process.cwd(), "assets/fonts/mona-sans-latin-500-normal.woff")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#141519",
          padding: 64,
          fontFamily: "Mona Sans",
          color: "#f4f3ef",
        }}
      >
        <div style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              background: "#ffe14d",
              color: "#16171b",
              borderRadius: 4,
              padding: "2px 12px",
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: -1.5,
            }}
          >
            Gapl
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 92, fontWeight: 800, lineHeight: 1.02, letterSpacing: -3 }}>
          <div style={{ display: "flex" }}>Six seconds.</div>
          <div style={{ display: "flex" }}>
            <span style={{ background: "#ffe14d", color: "#16171b", padding: "0 12px", borderRadius: 4 }}>Here&apos;s what they saw.</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              display: "flex",
              color: "#ff7b6f",
              border: "4px solid #ff7b6f",
              borderRadius: 6,
              padding: "4px 16px",
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: 3,
            }}
          >
            REJECT
          </div>
          <div style={{ fontSize: 28, fontWeight: 500, color: "#a7a9b2" }}>
            Your resume, read the way a recruiter reads it. gapl.in
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Mona Sans", data: heavy, style: "normal", weight: 800 },
        { name: "Mona Sans", data: regular, style: "normal", weight: 500 },
      ],
    }
  );
}
