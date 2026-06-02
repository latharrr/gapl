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
      <div className="w-6 h-6 border-2 border-[#4F46E5]/20 border-t-[#4F46E5] rounded-full animate-spin" />
    </div>
  );
}
