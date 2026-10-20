import type { Metadata } from "next";
import { Suspense } from "react";
import { PitchPage } from "@/components/pitch/pitch-page";
import { PitchSkeleton } from "@/components/pitch/pitch-skeleton";

export const metadata: Metadata = { title: "Proposition de services" };

type Params = Promise<{ runId: string; index: string }>;

// Même schéma que les autres pages à paramètres : la lecture de `params` est isolée dans un Suspense
async function Content({ params }: { params: Params }) {
  const { runId, index } = await params;
  const n = /^\d+$/.test(index) ? Number(index) : -1;
  return <PitchPage runId={runId} index={n} />;
}

export default function Page({ params }: { params: Params }) {
  return (
    <Suspense fallback={<PitchSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}