"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { IconlyLoader, IconlyDocument } from "@/components/icons/iconly";
import { useIsClient } from "@/hooks/use-is-client";
import { useNow } from "@/hooks/use-now";
import { useSearch } from "@/hooks/use-searches";
import { abortSearch, loadResults } from "@/lib/searches-store";
import { isFinal, type RunStatus } from "@/lib/run-status";
import { cn } from "@/lib/utils";
import { RunSkeleton } from "./run-skeleton";
import { StatusBadge } from "./status-badge";
import { ResultsExplorer } from "@/components/results/results-explorer";
import { ResultsGridSkeleton } from "@/components/results/results-grid-skeleton";


const mmss = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export function RunPage({ runId }: { runId: string }) {
  const ready = useIsClient();
  const search = useSearch(runId);
  const active = !!search && !isFinal(search.status);
  const now = useNow(active); // fait avancer la durée d'un run en cours
  const [aborting, setAborting] = useState(false);
  const [abortError, setAbortError] = useState<string | null>(null);

  if (!ready) return <RunSkeleton />;

  // Les recherches vivent en mémoire : un rechargement de la page les efface
  if (!search) {
    return (
      <>
        <PageHeader title="Recherche introuvable" />
        <div className="grid place-items-center gap-4 p-10 text-center">
          <p className="max-w-md text-sm text-muted-foreground">
            Cette recherche n&apos;est plus en mémoire (la page a été rechargée). Les
            collectes restent consultables sur Apify ; l&apos;historique local arrive plus tard.
          </p>
          <Button nativeButton={false} render={<Link href="/searches/new" />} className="h-10">Nouvelle recherche</Button>
        </div>
      </>
    );
  }

  async function handleAbort() {
    setAborting(true);
    setAbortError(null);
    try {
      await abortSearch(runId);
    } catch (e) {
      setAbortError(e instanceof Error ? e.message : "Interruption impossible");
    } finally {
      setAborting(false);
    }
  }

  const start = search.startedAt ? Date.parse(search.startedAt) : null;
  const end = search.finishedAt ? Date.parse(search.finishedAt) : now;
  const duration = start ? mmss(end - start) : "—";
  const cost = search.usageUsd != null ? `${search.usageUsd.toFixed(4)} $` : "—";
  const count = search.items ? search.items.length : null;

  return (
    <>
      <PageHeader
        title={search.actorName}
        description={`Run ${search.id}`}
        actions={
          active ? (
            <Button variant="outline" onClick={handleAbort} disabled={aborting} className="h-9">
              {aborting ? "Interruption…" : "Interrompre"}
            </Button>
          ) : (
            <Button nativeButton={false} render={<Link href="/searches/new" />} className="h-9">Nouvelle recherche</Button>
          )
        }
      />

      {/* Indicateurs */}
      <div className="grid grid-cols-2 gap-4 border-b border-border px-5 py-4 sm:px-6 lg:grid-cols-4 lg:divide-x lg:divide-border">
        <Stat label="Statut"><StatusBadge status={search.status} /></Stat>
        <Stat label="Durée">{duration}</Stat>
        <Stat label="Coût">{cost}</Stat>
        <Stat label="Résultats">{count ?? "—"}</Stat>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <Steps status={search.status} />

        {(abortError || search.error) && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <span>{abortError ?? search.error}</span>
            {/* Run terminé mais résultats non récupérés : on peut réessayer */}
            {isFinal(search.status) && search.items === null && (
              <Button size="sm" variant="outline" onClick={() => loadResults(runId)}>Réessayer</Button>
            )}
          </div>
        )}

        {/* Zone résultats : suit l'état du run */}
        {/* Zone résultats : suit l'état du run */}
        <section>
          {active ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 border border-border p-4 text-sm text-muted-foreground">
                <span className="animate-spin text-primary"><IconlyLoader size={20} color="currentColor" /></span>
                Collecte en cours… les résultats apparaîtront ici automatiquement.
              </div>
              <ResultsGridSkeleton count={4} />
            </div>
          ) : search.items === null ? (
            search.error ? (
              <p className="border border-border p-6 text-sm text-muted-foreground">Résultats indisponibles.</p>
            ) : (
              <ResultsGridSkeleton />
            )
          ) : search.items.length === 0 ? (
            <div className="grid place-items-center gap-2 border border-border p-10 text-center">
              <span className="grid size-10 place-items-center bg-muted"><IconlyDocument size={20} color="currentColor" /></span>
              <p className="font-medium">Aucun résultat</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {search.status === "failed"
                  ? "Le run a échoué avant de produire des données."
                  : "L'Actor n'a rien renvoyé. Vérifie ses paramètres et relance."}
              </p>
            </div>
          ) : (
            <ResultsExplorer items={search.items} total={search.total} />
          )}
        </section>
      </div>
    </>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1 lg:pl-4 lg:first:pl-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-base font-medium">{children}</div>
    </div>
  );
}

// Trois étapes : en attente → en cours → terminée / échouée / interrompue
function Steps({ status }: { status: RunStatus }) {
  const current = status === "pending" ? 0 : status === "running" ? 1 : 2;
  const last = status === "failed" ? "Échouée" : status === "aborted" ? "Interrompue" : "Terminée";
  const labels = ["En attente", "En cours", last];
  return (
    <ol className="flex items-center gap-3">
      {labels.map((label, i) => (
        <li key={label} className="flex flex-1 items-center gap-3">
          <span className={cn(
            "grid size-8 shrink-0 place-items-center border text-sm",
            i < current && "border-black bg-black text-white",
            i === current && (status === "failed" ? "border-destructive bg-destructive text-white"
              : status === "aborted" ? "border-highlight bg-highlight text-black"
                : "border-primary bg-primary text-white"),
            i > current && "border-border text-muted-foreground"
          )}>{i + 1}</span>
          <span className={cn("text-sm", i > current && "text-muted-foreground")}>{label}</span>
          {i < labels.length - 1 && <span className="h-px flex-1 bg-border" aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}