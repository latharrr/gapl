"use client";

import { Toaster } from "react-hot-toast";

// Toasts are slips of paper: white, ink text, a short soft shadow.
export function Toasts() {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        duration: 4200,
        style: {
          background: "var(--color-surface-DEFAULT)",
          color: "var(--color-ink)",
          border: "1px solid var(--color-border-DEFAULT)",
          borderRadius: "8px",
          boxShadow: "var(--shadow-lg)",
          fontSize: "0.9375rem",
          padding: "10px 14px",
        },
        success: { iconTheme: { primary: "#17784a", secondary: "#ffffff" } },
        error: { iconTheme: { primary: "#c8302a", secondary: "#ffffff" } },
      }}
    />
  );
}
