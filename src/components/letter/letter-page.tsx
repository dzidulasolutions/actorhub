"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { useIsClient } from "@/hooks/use-is-client";
import { useProfile } from "@/hooks/use-profile";
import { useSearch } from "@/hooks/use-searches";
import { normalizeResult } from "@/lib/normalize-results";
import { LetterEditor } from "./letter-editor";
import { LetterSkeleton } from "./letter-skeleton";

function Message({ title, text, href, label }: { title: string; text: string; href: string; label: string }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="grid place-items-center gap-4 p-10 text-center">
        <p className="max-w-md text-sm text-muted-foreground">{text}</p>
        <Button render={<Link href={href} />} nativeButton={false} className="h-10">{label}</Button>
      </div>
    </>
  );
}

export function LetterPage({ runId, index }: { runId: string; index: number }) {
  const ready = useIsClient();
  const search = useSearch(runId);
  const { profile } = useProfile();
  const item = search?.items?.[index];
  const result = useMemo(() => (item === undefined ? null : normalizeResult(item, index)), [item, index]);

  if (!ready) return <LetterSkeleton />;
  if (search && search.items === null && !search.error) return <LetterSkeleton />;

  if (!search || !result) {
    return (
      <Message
        title="Offre introuvable"
        text="Cette offre n'est plus en mémoire (la page a été rechargée) ou n'existe pas. Rouvre la recherche depuis l'Historique."
        href={search ? `/searches/${runId}` : "/searches"}
        label={search ? "Retour aux résultats" : "Ouvrir l'historique"}
      />
    );
  }
  if (result.kind !== "job") {
    return (
      <Message
        title="Pas une offre d'emploi"
        text="La lettre de motivation est prévue pour les offres d'emploi."
        href={`/searches/${runId}/results/${index}`}
        label="Retour à la fiche"
      />
    );
  }
  // key : une autre offre repart d'une lettre neuve
  return <LetterEditor key={`${runId}-${index}`} runId={runId} index={index} result={result} profile={profile} />;
}