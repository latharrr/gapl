"use client";

import { useEffect } from "react";
import { Archivo, Doto } from "next/font/google";
import "./globals.css";
import { StatusScreen, ghostOnDark } from "@/components/brand/StatusScreen";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", axes: ["wdth"], display: "swap" });
const doto = Doto({ subsets: ["latin"], variable: "--font-doto", weight: ["900"], display: "swap" });

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global Error caught:", error);
  }, [error]);

  return (
    <html lang="en" className={`${archivo.variable} ${doto.variable}`}>
      <body className="antialiased">
        <StatusScreen
          led="SYSTEM FAULT"
          title="Gapl hit a critical error."
          body="Reload the page or try again. If it keeps happening, email hello@gapl.in."
          actions={
            <>
              <button
                onClick={() => reset()}
                className="h-12 px-6 inline-flex items-center justify-center rounded-[6px] border-2 border-board-ink bg-board text-board-ink font-semibold"
              >
                Try again
              </button>
              <button onClick={() => window.location.reload()} className={ghostOnDark}>
                Reload the page
              </button>
            </>
          }
        />
      </body>
    </html>
  );
}
