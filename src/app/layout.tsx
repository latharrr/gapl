import type { Metadata, Viewport } from "next";
import { Mona_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toasts } from "@/components/brand/Toasts";

// Mona Sans: every UI word and figure. CMU Serif: resume text only (the LaTeX resume students know).
const mona = Mona_Sans({
  subsets: ["latin"],
  variable: "--font-mona",
  axes: ["wdth"],
  display: "swap",
});

const cmu = localFont({
  src: [
    { path: "../fonts/cmu/cmu-serif-500-roman.woff2", weight: "400", style: "normal" },
    { path: "../fonts/cmu/cmu-serif-700-roman.woff2", weight: "700", style: "normal" },
    { path: "../fonts/cmu/cmu-serif-500-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-cmu",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    template: "%s | Gapl",
    default: "Gapl — See what a recruiter sees in your resume",
  },
  description:
    "Recruiters give your resume six seconds. Gapl shows what they saw, the line that sank it, and what to build to get shortlisted.",
  metadataBase: new URL("https://gapl.in"),
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#141519",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${mona.variable} ${cmu.variable}`} suppressHydrationWarning>
      <head>
        {/* Lets CSS hold the sample resume's marks until it scrolls into view; without JS they simply show. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="bg-surface-muted text-ink antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Toasts />
      </body>
    </html>
  );
}
