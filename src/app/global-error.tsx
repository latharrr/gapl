"use client";

import { useEffect } from "react";
import { Mona_Sans } from "next/font/google";
import "./globals.css";
import { StatusScreen, ghostOnDark } from "@/components/brand/StatusScreen";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const mona = Mona_Sans({ subsets: ["latin"], variable: "--font-mona", axes: ["wdth"], display: "swap" });

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global Error caught:", error);
  }, [error]);

  return (
    <html lang="en" className={mona.variable}>
      <body className="antialiased">
        <StatusScreen
          mark="Something broke"
          title="Gapl hit a critical error."
          body="Reload the page or try again. If it keeps happening, email hello@gapl.in."
          actions={
            <>
              <button
                onClick={() => reset()}
                className={cn(buttonBase, buttonVariants.primary, buttonSizes.lg)}
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
