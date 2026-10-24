"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { StatusScreen, ghostOnDark } from "@/components/brand/StatusScreen";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Page-level Error caught:", error);
  }, [error]);

  return (
    <StatusScreen
      mark="Something broke"
      title="Something went wrong on this page."
      body="An unexpected error stopped it from loading. Try again; if it keeps happening, email deepanshulathar@gmail.com."
      actions={
        <>
          <Button size="lg" onClick={() => reset()}>
            Try again
          </Button>
          <button onClick={() => window.location.reload()} className={ghostOnDark}>
            Reload the page
          </button>
        </>
      }
    />
  );
}
