"use client";

import { useParams } from "next/navigation";
import { AppDetail } from "./AppDetail";

export function AppDetailRoute() {
  const { id } = useParams<{ id: string }>();
  return <AppDetail id={id} />;
}
