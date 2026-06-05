"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Page-level Error caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-6">
      <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center">
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

      <div className="max-w-md space-y-2">
        <h2 className="text-xl font-bold text-[#111111]">Something went wrong</h2>
        <p className="text-sm text-[#71717a] leading-relaxed">
          An unexpected error occurred while loading this page. Please try again.
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
        <Button variant="primary" size="sm" className="bg-[#111111]" onClick={() => reset()}>
          Try again
        </Button>
      </div>
    </div>
  );
}
