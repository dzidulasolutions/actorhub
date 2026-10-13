import type { Metadata } from "next";
import { Suspense } from "react";
import { RunPage } from "@/components/searches/run-page";
import { RunSkeleton } from "@/components/searches/run-skeleton";

export const metadata: Metadata = { title: "Suivi de recherche" };

// La lecture de `params` (connu seulement à la visite) est isolée dans un composant
// enveloppé par Suspense : la coque de la page se prérend, le skeleton s'affiche le temps de la lecture.
async function RunContent({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return <RunPage runId={runId} />;
}

export default function Page({ params }: { params: Promise<{ runId: string }> }) {
  return (
    <Suspense fallback={<RunSkeleton />}>
      <RunContent params={params} />
    </Suspense>
  );
}