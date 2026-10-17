import { cn } from "@/lib/utils";

interface WordmarkProps {
  className?: string;
  size?: "sm" | "md";
}

// The name set as a station nameboard: yellow plate, black rim, heavy grotesque.
export function Wordmark({ className, size = "md" }: WordmarkProps) {
  return (
    <span
      className={cn(
        "signboard signboard-sm inline-flex items-center font-[850] leading-none tracking-[-0.02em] [font-variation-settings:'wdth'_100]",
        size === "md" ? "h-8 px-3.5 text-[1.0625rem]" : "h-7 px-2.5 text-[0.9375rem]",
        className
      )}
    >
      Gapl
    </span>
  );
}
