import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="bg-[#FAFAFA] text-[#111111] antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
