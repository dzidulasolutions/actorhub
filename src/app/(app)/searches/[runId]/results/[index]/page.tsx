import type { Metadata } from "next";
import { Suspense } from "react";
import { ResultDetail } from "@/components/results/result-detail";
import { ResultDetailSkeleton } from "@/components/results/result-detail-skeleton";

export const metadata: Metadata = { title: "Fiche du résultat" };

type Params = Promise<{ runId: string; index: string }>;

// Même schéma que la page de suivi : la lecture de `params` est isolée dans un Suspense
async function Content({ params }: { params: Params }) {
  const { runId, index } = await params;
  const n = /^\d+$/.test(index) ? Number(index) : -1; // index invalide → "Résultat introuvable"
  return <ResultDetail runId={runId} index={n} />;
}

export default function Page({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ResultDetailSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}