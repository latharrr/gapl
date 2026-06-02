function extension(fileName: string) {
  const index = fileName.lastIndexOf(".");
  return index >= 0 ? fileName.slice(index).toLowerCase() : "";
}

export function validateResumeContent(text: string): { isResume: boolean; reason: string } {
  const lower = text.toLowerCase();
  if (text.trim().length < 100) return { isResume: false, reason: "Content is too short to be a resume." };

  const signals = [
    "experience", "education", "skills", "projects", "internship", "summary",
    "achievements", "certifications", "curriculum vitae", "resume", "cgpa",
    "gpa", "b.tech", "b.e.", "b.sc", "bachelor", "master", "degree",
    "university", "college", "linkedin", "github",
  ];
  const negatives = [
    "chapter ", "table of contents", "doi:", "restaurant", "menu item",
    "invoice", "receipt", "total amount due", "purchase order", "bibliography",
  ];

  if (negatives.filter((signal) => lower.includes(signal)).length >= 2) {
    return { isResume: false, reason: "This looks like a different kind of document (like a receipt or invoice). Please upload a valid resume." };
  }
  if (signals.filter((signal) => lower.includes(signal)).length < 3) {
    return { isResume: false, reason: "This does not look like a resume. Include sections such as education, skills, projects, or experience." };
  }
  return { isResume: true, reason: "" };
}

export async function extractText(file: File): Promise<string> {
  if (file.type === "text/plain" || extension(file.name) === ".txt") return file.text();
  const { extractText: unpdfExtract } = await import("unpdf");
  const { text } = await unpdfExtract(new Uint8Array(await file.arrayBuffer()), { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : text;
}
