import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/resend";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const userOrError = await requireUser(req);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    const body = await req.json();
    const { cv } = body;

    if (!cv || !cv.name) {
      return NextResponse.json({ error: "CV data payload is required." }, { status: 400 });
    }

    const bodyHtml = `
      <div style="font-family: 'Times New Roman', Times, serif; max-width: 650px; margin: 0 auto; color: #111111; line-height: 1.45; font-size: 11pt; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; border-bottom: 2px solid #111111; padding-bottom: 10px; margin-bottom: 16px;">
          <h2 style="font-size: 20pt; font-weight: bold; margin: 0 0 6px 0; letter-spacing: 0.04em;">${cv.name}</h2>
          <div style="font-size: 9.5pt; color: #444444;">
            ${cv.email ? `${cv.email} &middot; ` : ""}${cv.phone ? `${cv.phone} &middot; ` : ""}${cv.location || ""}<br/>
            ${cv.linkedin ? `<a href="${cv.linkedin}" style="color: #444444; text-decoration: none;">${cv.linkedin.replace("https://", "")}</a>` : ""}
            ${cv.github ? ` &middot; <a href="${cv.github}" style="color: #444444; text-decoration: none;">${cv.github.replace("https://", "")}</a>` : ""}
          </div>
        </div>

        <!-- Objective -->
        ${cv.objective ? `
          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 11pt; font-weight: bold; border-bottom: 1px solid #111111; text-transform: uppercase; margin: 0 0 6px 0; padding-bottom: 2px; letter-spacing: 0.05em;">Objective</h3>
            <p style="margin: 0; font-size: 10pt; color: #222222; text-align: justify;">${cv.objective}</p>
          </div>
        ` : ""}

        <!-- Experience -->
        ${cv.experience && cv.experience.length > 0 ? `
          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 11pt; font-weight: bold; border-bottom: 1px solid #111111; text-transform: uppercase; margin: 0 0 6px 0; padding-bottom: 2px; letter-spacing: 0.05em;">Experience</h3>
            ${cv.experience.map((exp: any) => `
              <div style="margin-bottom: 10px; font-size: 10pt;">
                <div style="display: flex; justify-content: space-between; font-weight: bold;">
                  <span>${exp.role}</span>
                  <span style="font-weight: normal; color: #555555;">${exp.duration}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-style: italic; margin-top: 1px;">
                  <span style="color: #444444;">${exp.company}</span>
                  <span style="color: #555555; font-style: italic;">${exp.location}</span>
                </div>
                <ul style="margin: 4px 0 0 18px; padding: 0;">
                  ${exp.bullets.map((bullet: string) => `
                    <li style="margin-bottom: 3px; text-align: justify;">${bullet}</li>
                  `).join("")}
                </ul>
              </div>
            `).join("")}
          </div>
        ` : ""}

        <!-- Skills -->
        ${cv.skills && cv.skills.length > 0 ? `
          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 11pt; font-weight: bold; border-bottom: 1px solid #111111; text-transform: uppercase; margin: 0 0 6px 0; padding-bottom: 2px; letter-spacing: 0.05em;">Skills</h3>
            <table style="width: 100%; font-size: 10pt; border-collapse: collapse;">
              <tbody>
                ${cv.skills.map((skill: any) => `
                  <tr>
                    <td style="font-weight: bold; padding-bottom: 4px; vertical-align: top; width: 140px;">${skill.category}</td>
                    <td style="padding-bottom: 4px; color: #222222;">${skill.items}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        ` : ""}

        <!-- Projects -->
        ${cv.projects && cv.projects.length > 0 ? `
          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 11pt; font-weight: bold; border-bottom: 1px solid #111111; text-transform: uppercase; margin: 0 0 6px 0; padding-bottom: 2px; letter-spacing: 0.05em;">Projects</h3>
            <ul style="margin: 0; padding: 0; list-style: none;">
              ${cv.projects.map((proj: any) => `
                <li style="margin-bottom: 6px; font-size: 10pt; text-align: justify;">
                  <strong style="font-weight: bold;">${proj.name}</strong> &ndash; 
                  <span style="color: #222222;">${proj.description}</span>
                </li>
              `).join("")}
            </ul>
          </div>
        ` : ""}

        <!-- Education -->
        ${cv.education && cv.education.length > 0 ? `
          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 11pt; font-weight: bold; border-bottom: 1px solid #111111; text-transform: uppercase; margin: 0 0 6px 0; padding-bottom: 2px; letter-spacing: 0.05em;">Education</h3>
            ${cv.education.map((ed: any) => `
              <div style="margin-bottom: 8px; font-size: 10pt;">
                <div style="display: flex; justify-content: space-between; font-weight: bold;">
                  <span>${ed.degree}</span>
                  <span style="font-weight: normal; color: #555555;">${ed.year}</span>
                </div>
                <div style="color: #444444;">${ed.institution}</div>
                ${ed.coursework ? `
                  <div style="font-size: 9.5pt; color: #666666; margin-top: 2px;">
                    <strong>Relevant Coursework:</strong> ${ed.coursework}
                  </div>
                ` : ""}
              </div>
            `).join("")}
          </div>
        ` : ""}

        <!-- Activities -->
        ${cv.activities && cv.activities.length > 0 ? `
          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 11pt; font-weight: bold; border-bottom: 1px solid #111111; text-transform: uppercase; margin: 0 0 6px 0; padding-bottom: 2px; letter-spacing: 0.05em;">Activities</h3>
            <ul style="margin: 4px 0 0 18px; padding: 0; font-size: 10pt; color: #222222;">
              ${cv.activities.map((act: string) => `
                <li style="margin-bottom: 2px;">${act}</li>
              `).join("")}
            </ul>
          </div>
        ` : ""}
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: `Gapl Generated CV: ${cv.name}`,
      html: bodyHtml,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to email CV:", err);
    return NextResponse.json({ error: err.message || "Failed to send email." }, { status: 500 });
  }
}
