import { Suspense } from "react";
import { APPLICATIONS } from "@/lib/applications";
import { AppDetailRoute } from "@/components/app/AppDetailRoute";

export function generateStaticParams() {
  return APPLICATIONS.map((a) => ({ id: a.id }));
}

export default function Page() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-32 text-center text-muted">Loading…</div>}>
      <AppDetailRoute />
    </Suspense>
  );
}
