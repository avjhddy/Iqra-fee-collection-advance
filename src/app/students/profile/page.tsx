"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { StudentProfileView } from "@/components/ProfileViews";

function StudentProfilePageInner() {
  const params = useSearchParams();
  const id = params.get("id") || "";
  return <StudentProfileView id={id} />;
}

export default function StudentProfilePage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm">Loading student…</div>}>
      <StudentProfilePageInner />
    </Suspense>
  );
}
