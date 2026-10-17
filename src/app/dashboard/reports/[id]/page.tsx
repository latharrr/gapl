"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { LoadingChart } from "@/components/ui/Sheet";

// The new report page is at /report/[id]
// Redirect dashboard/reports/[id] → /report/[id]
export default function LegacyReportRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const id = params.id as string;
    router.replace(`/report/${id}`);
  }, [params.id, router]);

  return <LoadingChart text="OPENING CHART" className="min-h-screen items-center" />;
}
