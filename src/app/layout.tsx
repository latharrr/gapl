import type { Metadata, Viewport } from "next";
import { Archivo, Martian_Mono, Doto } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

// Archivo: signage + UI voice. Martian Mono: chart data only. Doto: LED boards only.
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  axes: ["wdth"],
  display: "swap",
});

const martian = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-martian",
  axes: ["wdth"],
  display: "swap",
});

const doto = Doto({
  subsets: ["latin"],
  variable: "--font-doto",
  weight: ["700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Gapl",
    default: "Gapl — Application Readiness Engine",
  },
  description:
    "Know why you're not getting shortlisted. Gapl analyzes your resume, identifies skill gaps, and gives you a week-by-week roadmap.",
  metadataBase: new URL("https://gapl.in"),
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#1D2B6B",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${martian.variable} ${doto.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-surface-muted text-ink antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
