import type { Metadata } from "next";
import { Suspense } from "react";
import { LetterPage } from "@/components/letter/letter-page";
import { LetterSkeleton } from "@/components/letter/letter-skeleton";

export const metadata: Metadata = { title: "Candidature" };

type Params = Promise<{ runId: string; index: string }>;

// Même schéma que les autres pages à paramètres : la lecture de `params` est isolée dans un Suspense
async function Content({ params }: { params: Params }) {
  const { runId, index } = await params;
  const n = /^\d+$/.test(index) ? Number(index) : -1;
  return <LetterPage runId={runId} index={n} />;
}

export default function Page({ params }: { params: Params }) {
  return (
    <Suspense fallback={<LetterSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}