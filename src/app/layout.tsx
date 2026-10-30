import type { Metadata, Viewport } from "next";
import { Mona_Sans, Newsreader } from "next/font/google";
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

// Newsreader: landing display headlines only (the editorial serif of the Mercor + Gem landing).
const news = Newsreader({
  subsets: ["latin"],
  variable: "--font-news",
  axes: ["opsz"],
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
  metadataBase: new URL("https://gapl.vercel.app"),
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#fcfcfc",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${mona.variable} ${news.variable} ${cmu.variable}`} suppressHydrationWarning>
      <head>
        {/* js: lets CSS hold the sample resume's marks until they scroll into view; without JS they simply show.
            lite: phones, touch, low memory/cores, data saver or slow links get the light page (no film canvas,
            no smooth scroll, no blur), set before first paint so nothing heavy starts. */}
        <script dangerouslySetInnerHTML={{ __html: "var d=document.documentElement,n=navigator,c=n.connection||{};d.classList.add('js');if(matchMedia('(max-width: 768px), (pointer: coarse)').matches||(n.deviceMemory||8)<=4||(n.hardwareConcurrency||8)<=4||c.saveData||/2g|3g/.test(c.effectiveType||''))d.classList.add('lite')" }} />
      </head>
      <body className="bg-surface-muted text-ink antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Toasts />
      </body>
    </html>
  );
}
