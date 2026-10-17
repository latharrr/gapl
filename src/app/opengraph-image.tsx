import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Gapl — know why you're not getting shortlisted";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social share card: the station signboard over rail navy, with a status stamp.
export default async function OpengraphImage() {
  // Archivo Black (OFL) for the signboard voice; process.cwd() is the project root.
  const archivoBlack = await readFile(join(process.cwd(), "assets/fonts/ArchivoBlack-Regular.ttf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#1d2b6b",
          padding: 56,
          fontFamily: "Archivo Black",
          borderBottom: "14px solid #f5c518",
        }}
      >
        <div style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              background: "#f5c518",
              color: "#14140f",
              border: "4px solid #14140f",
              borderRadius: 8,
              padding: "6px 22px",
              fontSize: 40,
              fontWeight: 900,
            }}
          >
            Gapl
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: "#f5c518",
            border: "6px solid #14140f",
            borderRadius: 10,
            padding: "36px 44px",
          }}
        >
          <div style={{ fontSize: 72, color: "#14140f", lineHeight: 1.04, letterSpacing: -1.5 }}>
            Know why you&apos;re not getting shortlisted.
          </div>
          <div style={{ marginTop: 22, fontSize: 26, fontWeight: 700, color: "#14140f", letterSpacing: 2 }}>
            RECRUITER VERDICT · SKILL GAPS · WHAT TO BUILD NEXT
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              background: "#f6e1dd",
              color: "#b0241c",
              border: "3px solid #b0241c",
              borderRadius: 4,
              padding: "4px 14px",
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            WL 3 / REJECT
          </div>
          <div style={{ fontSize: 26, color: "#d8dcee" }}>Every status comes with a remark. gapl.in</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Archivo Black", data: archivoBlack, style: "normal", weight: 400 }],
    }
  );
}
