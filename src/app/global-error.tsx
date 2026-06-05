"use client";

import { useEffect } from "react";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global Error caught:", error);
  }, [error]);

  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#FAFAFA] text-[#111111] antialiased min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#111111]">Application Error</h2>
            <p className="text-sm text-[#71717a] leading-relaxed">
              A critical failure occurred. Please reload the page or click Try Again.
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-xs font-semibold border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-all"
            >
              Reload Page
            </button>
            <button
              onClick={() => reset()}
              className="px-4 py-2 text-xs font-semibold bg-[#111111] text-white hover:bg-black rounded-xl transition-all"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
