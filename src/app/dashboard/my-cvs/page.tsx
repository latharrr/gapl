"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getUserCVs, type SavedCV } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Sheet, PageHeader, EmptyChart, LoadingChart, APP_PAGE } from "@/components/ui/Sheet";
import { Plus, PenLine, ArrowRight } from "lucide-react";

function formatDate(val: SavedCV["createdAt"]): string {
  try {
    const d = typeof val === "object" && "toDate" in val ? val.toDate() : new Date(val as unknown as string);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export default function MyCVsPage() {
  const { user } = useAuth();
  const [cvs, setCVs] = useState<SavedCV[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserCVs(user.uid)
      .then(setCVs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className={APP_PAGE}>
      <PageHeader
        title="My CVs"
        description="Every CV you have built with Gapl, saved automatically."
        actions={
          <Link href="/cv-builder">
            <Button size="md">
              <Plus size={16} strokeWidth={2.5} /> Build a new CV
            </Button>
          </Link>
        }
      />

      {loading ? (
        <LoadingChart text="LOADING CVS" />
      ) : cvs.length === 0 ? (
        <Sheet>
          <EmptyChart
            led="NO CVS YET"
            title="Build your first CV"
            action={
              <Link href="/cv-builder">
                <Button size="lg"><PenLine size={17} /> Build my CV</Button>
              </Link>
            }
          >
            Gapl rewrites your bullets around evidence and ATS fit, then saves every version here.
          </EmptyChart>
        </Sheet>
      ) : (
        <Sheet title="Saved CVs" aside={`${cvs.length} saved`}>
          <ul className="chart-rows">
            {cvs.map((cv) => {
              const improvement = cv.atsScore - cv.originalAtsScore;
              return (
                <li
                  key={cv.id}
                  className="grid gap-x-5 gap-y-2 px-4 sm:px-6 py-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_7rem_8rem_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <p className="font-bold truncate">{cv.name || "Unnamed CV"}</p>
                    <p className="text-sm text-ink-muted truncate">{cv.role}</p>
                  </div>
                  <p className="text-sm text-ink-secondary">{cv.companyType}</p>
                  <p className="chart-data text-sm">
                    <span className={cn("font-bold", cv.atsScore >= 90 ? "text-success" : "text-warning")}>ATS {cv.atsScore}</span>
                    <span className="block text-xs text-ink-muted">
                      {improvement >= 0 ? "+" : ""}
                      {improvement} from original
                    </span>
                  </p>
                  <p className="chart-data text-xs text-ink-muted">{formatDate(cv.createdAt)}</p>
                  <Link
                    href="/cv-builder"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline whitespace-nowrap"
                  >
                    Rebuild <ArrowRight size={14} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Sheet>
      )}
    </div>
  );
}
