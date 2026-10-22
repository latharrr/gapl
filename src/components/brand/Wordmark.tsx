import { cn } from "@/lib/utils";

interface WordmarkProps {
  className?: string;
  size?: "sm" | "md";
}

// The name as a highlighted word: what the recruiter's eye caught.
export function Wordmark({ className, size = "md" }: WordmarkProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center bg-highlight text-ink font-[820] leading-none tracking-[-0.035em] [font-variation-settings:'wdth'_112] rounded-[3px]",
        size === "md" ? "h-8 px-2 text-[1.3125rem]" : "h-7 px-1.5 text-[1.125rem]",
        className
      )}
    >
      Gapl
    </span>
  );
}
