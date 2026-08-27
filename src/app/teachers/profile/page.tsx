"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TeacherProfileView } from "@/components/ProfileViews";

function TeacherProfilePageInner() {
  const params = useSearchParams();
  const id = params.get("id") || "";
  return <TeacherProfileView id={id} />;
}

export default function TeacherProfilePage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm">Loading teacher…</div>}>
      <TeacherProfilePageInner />
    </Suspense>
  );
}
