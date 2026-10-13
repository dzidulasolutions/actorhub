"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/searches/status-badge";
import { IconlyPaper, IconlyTrash } from "@/components/icons/iconly";
import { useSavedSearches } from "@/hooks/use-saved-searches";
import { useSearches } from "@/hooks/use-searches";
import { openSaved, removeSaved } from "@/lib/saved-searches-store";
import type { SavedSearchMeta } from "@/lib/saved-searches-db";
import { HistorySkeleton } from "./history-skeleton";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });
const fmtDate = (iso: string | null) => (iso ? dateFormat.format(new Date(iso)) : "—");

// Résumé d'une ligne des paramètres de la recherche (texte brut)
const inputSummary = (input: Record<string, unknown>) => {
  const s = JSON.stringify(input);
  return s.length > 120 ? `${s.slice(0, 120)}…` : s;
};

const countLabel = (n: number) => `${n} résultat${n > 1 ? "s" : ""}`;

export function HistoryPage() {
  const { saved, ready, error } = useSavedSearches();
  const session = useSearches();
  const [toDelete, setToDelete] = useState<SavedSearchMeta | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!ready) return <HistorySkeleton />;

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await removeSaved(toDelete.id);
      setDeleteError(null);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Suppression impossible");
    }
  }

  const savedIds = new Set((saved ?? []).map((m) => m.id));

  return (
    <>
      <PageHeader
        title="Historique"
        description="Tes recherches de cette session et celles sauvegardées dans ce navigateur"
      />

      <div className="space-y-8 p-5 sm:p-6">
        {(error || deleteError) && (
          <p role="alert" className="border-l-2 border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {deleteError ?? error}
          </p>
        )}

        {/* ===== Session en cours (en mémoire) ===== */}
        {session.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Cette session</h2>
            {session.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-4 border border-border bg-card p-4">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-medium">{s.actorName}</p>
                    <StatusBadge status={s.status} />
                    {savedIds.has(s.id) && <span className="bg-success/10 px-2 py-1 text-xs text-success">Sauvegardée</span>}
                  </div>
                  <p className="truncate font-mono text-xs text-muted-foreground">{inputSummary(s.input)}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmtDate(s.startedAt)}
                    {s.items && ` · ${countLabel(s.items.length)}`}
                  </p>
                </div>
                <Button render={<Link href={`/searches/${s.id}`} />} nativeButton={false} variant="outline" className="h-9">
                  Voir
                </Button>
              </div>
            ))}
          </section>
        )}

        {/* ===== Sauvegardes (IndexedDB) ===== */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Sauvegardées dans ce navigateur</h2>

          {saved && saved.length === 0 ? (
            <div className="grid place-items-center gap-3 border border-dashed border-border px-6 py-14 text-center">
              <span className="grid size-12 place-items-center bg-black text-white">
                <IconlyPaper size={24} color="currentColor" />
              </span>
              <div className="space-y-1">
                <p className="font-medium">Aucune recherche sauvegardée</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Après une recherche, clique sur « Sauvegarder » : tu pourras la rouvrir ici sans
                  relancer l&apos;Actor, donc sans dépenser de crédits Apify.
                </p>
              </div>
            </div>
          ) : (
            saved?.map((m) => <SavedRow key={m.id} meta={m} onDelete={() => setToDelete(m)} />)
          )}

          <p className="border-l-2 border-primary bg-accent px-4 py-3 text-xs">
            Ces sauvegardes restent dans ce navigateur : elles disparaissent si tu vides les données
            du site. Pour une copie durable, télécharge un fichier JSON depuis la page de résultats.
          </p>
        </section>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette sauvegarde ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les {toDelete ? countLabel(toDelete.count) : "résultats"} de « {toDelete?.actorName} »
              seront effacés de ce navigateur. Les fichiers JSON déjà téléchargés ne sont pas touchés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SavedRow({ meta, onDelete }: { meta: SavedSearchMeta; onDelete: () => void }) {
  const router = useRouter();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setOpening(true);
    setError(null);
    try {
      await openSaved(meta.id); // lit IndexedDB : aucun appel à Apify
      router.push(`/searches/${meta.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ouverture impossible");
      setOpening(false);
    }
  }

  return (
    <div className="space-y-2 border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-medium">{meta.actorName}</p>
            <StatusBadge status={meta.status} />
          </div>
          <p className="truncate font-mono text-xs text-muted-foreground">{meta.apifyId}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">{inputSummary(meta.input)}</p>
          <p className="text-xs text-muted-foreground">
            {countLabel(meta.count)}
            {meta.total !== null && meta.total > meta.count && ` sur ${meta.total}`}
            {" · "}collectée le {fmtDate(meta.startedAt)}
            {" · "}sauvegardée le {fmtDate(meta.savedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={open} disabled={opening} className="h-9 px-5">
            {opening ? "Ouverture…" : "Voir"}
          </Button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Supprimer la sauvegarde de ${meta.actorName}`}
            className="grid size-9 place-items-center border border-border text-muted-foreground transition-colors hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <IconlyTrash size={18} color="currentColor" />
          </button>
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}