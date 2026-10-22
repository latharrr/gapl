import { cn } from "@/lib/utils";

/* Data table: a ruled header in small caps, hairline rows, tabular figures. */
export function Table({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-sm border-collapse", className)}>{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-border-strong text-left text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-ink-muted">
      {children}
    </thead>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-border-DEFAULT">{children}</tbody>;
}

export function Th({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <th className={cn("px-4 sm:px-5 py-2.5 font-bold whitespace-nowrap", className)}>{children}</th>;
}

export function Td({
  className,
  children,
  mono,
  colSpan,
}: {
  className?: string;
  children?: React.ReactNode;
  mono?: boolean;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={cn("px-4 sm:px-5 py-3 align-middle", mono && "figure text-[0.8125rem]", className)}>
      {children}
    </td>
  );
}
