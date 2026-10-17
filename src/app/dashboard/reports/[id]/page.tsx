"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

// The new report page is at /report/[id]
// Redirect dashboard/reports/[id] → /report/[id]
export default function LegacyReportRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const id = params.id as string;
    router.replace(`/report/${id}`);
  }, [params.id, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-6 h-6 border-2 border-primary-600/20 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );
}
