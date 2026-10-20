"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PageHeader } from "@/components/layout/page-header";
import { IconlyTrash } from "@/components/icons/iconly";
import { removeSent, updateSent, useSentLog } from "@/hooks/use-sent-log";
import { useIsClient } from "@/hooks/use-is-client";
import { useProfile } from "@/hooks/use-profile";
import { useSearches } from "@/hooks/use-searches";
import { MAX_NOTE, type ContactStatus, type SentEntry } from "@/lib/sent-log";
import {
  daysSince, entryKey, filterEntries, MAX_FOLLOW_UPS, needsFollowUp, resolveRefs, sortEntries, statusOf,
  summarize, type ResolvedRef, type TrackingFilter,
} from "@/lib/tracking";
import { cn } from "@/lib/utils";
import { FollowUpForm } from "./follow-up-form";
import { TrackingSkeleton } from "./tracking-skeleton";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });
const STATUS_LABELS: Record<ContactStatus, string> = { waiting: "En attente", replied: "Réponse reçue", done: "Terminé" };
const FILTER_LABELS: Record<TrackingFilter, string> = {
  all: "Tous", waiting: "En attente", due: "À relancer", replied: "Réponses", done: "Terminés",
};

const ago = (days: number) => (days === 0 ? "aujourd'hui" : days === 1 ? "hier" : `il y a ${days} jours`);

export function TrackingPage() {
  const ready = useIsClient();
  // Le tableau n'est monté qu'après l'hydratation : lire l'heure actuelle y est sans risque pour le prérendu
  return ready ? <TrackingBoard /> : <TrackingSkeleton />;
}

function TrackingBoard() {
  const [now] = useState(() => Date.now());
  const log = useSentLog();
  const { profile } = useProfile();
  const searches = useSearches();
  const [filter, setFilter] = useState<TrackingFilter>("all");
  const [followUp, setFollowUp] = useState<SentEntry | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toDelete, setToDelete] = useState<SentEntry | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const summary = useMemo(() => summarize(log, now), [log, now]);
  const visible = useMemo(() => sortEntries(filterEntries(log, filter, now), now), [log, filter, now]);
  const refs = useMemo(() => new Set(log.map((e) => e.ref).filter((r): r is string => !!r)), [log]);
  const resolved = useMemo(() => resolveRefs(searches, refs), [searches, refs]);

  const stats: { label: string; value: number; accent?: boolean }[] = [
    { label: "Messages envoyés", value: summary.total },
    { label: "En attente", value: summary.waiting },
    { label: "À relancer", value: summary.due, accent: summary.due > 0 },
    { label: "Réponses reçues", value: summary.replied },
  ];

  return (
    <>
      <PageHeader title="Suivi" description="Les candidatures et propositions que tu as envoyées" />

      <div className="grid grid-cols-2 gap-4 border-b border-border px-5 py-4 sm:px-6 lg:grid-cols-4 lg:divide-x lg:divide-border">
        {stats.map((s) => (
          <div key={s.label} className="space-y-1 lg:pl-4 lg:first:pl-0">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={cn("text-xl font-semibold leading-tight", s.accent && "text-highlight")}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        {log.length === 0 ? (
          <div className="grid place-items-center gap-4 border border-dashed border-border px-6 py-16 text-center">
            <span className="grid size-12 place-items-center bg-black text-white"><Send className="size-6" /></span>
            <div className="space-y-1">
              <p className="font-medium">Aucun message suivi pour l&apos;instant</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Ce que tu envoies avec le bouton « Envoyer » apparaît ici automatiquement. Si tu envoies avec Gmail ou ton application
                mail, clique sur « J&apos;ai envoyé ce message » sur la page Candidature ou Proposition.
              </p>
            </div>
            <Button render={<Link href="/searches/new" />} nativeButton={false} className="h-9">Nouvelle recherche</Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer le suivi">
              {(Object.keys(FILTER_LABELS) as TrackingFilter[]).map((f) => {
                const count = f === "all" ? summary.total : summary[f];
                return (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={filter === f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "border px-3 py-1.5 text-sm transition-colors",
                      filter === f ? "border-primary bg-accent font-medium text-primary" : "border-border hover:bg-muted"
                    )}
                  >
                    {FILTER_LABELS[f]} <span className="text-muted-foreground">({count})</span>
                  </button>
                );
              })}
            </div>

            {visible.length === 0 ? (
              <p className="border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
                Aucun contact dans cette catégorie.
              </p>
            ) : (
              <ul className="space-y-4">
                {visible.map((e) => (
                  <li key={entryKey(e)}>
                    <EntryCard
                      entry={e}
                      now={now}
                      link={e.ref ? (resolved.get(e.ref) ?? null) : undefined}
                      onFollowUp={() => { setFollowUp(e); setSheetOpen(true); }}
                      onDelete={() => { setToDelete(e); setDeleteOpen(true); }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <p className="text-xs text-muted-foreground">
          Ce suivi est enregistré dans ce navigateur : il disparaît si tu vides les données du site.
        </p>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
          <SheetHeader className="border-b border-border p-6">
            <SheetTitle className="text-lg">Relancer {followUp?.company ?? followUp?.to}</SheetTitle>
            <SheetDescription>Un message court et poli, à relire avant de l&apos;envoyer.</SheetDescription>
          </SheetHeader>
          {followUp && (
            <FollowUpForm key={entryKey(followUp)} entry={followUp} profile={profile} onDone={() => setSheetOpen(false)} />
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce contact du suivi ?</AlertDialogTitle>
            <AlertDialogDescription>
              Il ne sera plus suivi ici. Le message déjà envoyé n&apos;est pas affecté.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) removeSent(entryKey(toDelete));
                setDeleteOpen(false); // la modale se ferme toujours elle-même
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EntryCard({
  entry, now, link, onFollowUp, onDelete,
}: {
  entry: SentEntry;
  now: number;
  link: ResolvedRef | null | undefined; // undefined : pas de fiche liée ; null : fiche hors mémoire
  onFollowUp: () => void;
  onDelete: () => void;
}) {
  const key = entryKey(entry);
  const status = statusOf(entry);
  const due = needsFollowUp(entry, now);
  const pitch = entry.purpose === "pitch";
  const [note, setNote] = useState(entry.note ?? "");
  const followUps = entry.followUps ?? 0;
  const days = daysSince(entry.sentAt, now);

  const saveNote = () => {
    if (note.trim() !== (entry.note ?? "")) updateSent(key, { note: note.trim() });
  };
  const messageHref = link ? `/searches/${link.runId}/results/${link.index}/${pitch ? "pitch" : "letter"}` : null;

  return (
    <article className={cn("space-y-3 border bg-card p-4", due ? "border-highlight" : "border-border")}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="min-w-0 truncate font-medium">{entry.company ?? entry.to}</h2>
        <span className="bg-muted px-2 py-0.5 text-xs text-muted-foreground">{pitch ? "Proposition" : "Candidature"}</span>
        {due && <span className="bg-highlight/15 px-2 py-0.5 text-xs font-medium">Relance suggérée</span>}
        {status !== "waiting" && (
          <span className={cn("px-2 py-0.5 text-xs", status === "replied" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
            {STATUS_LABELS[status]}
          </span>
        )}
      </div>

      <div className="space-y-1 text-sm">
        <p className="truncate font-mono text-xs text-muted-foreground">{entry.to}</p>
        <p className="truncate">{entry.subject}</p>
        <p className="text-xs text-muted-foreground">
          Envoyé {ago(days)} ({dateFormat.format(new Date(entry.sentAt))})
          {followUps > 0 && ` · relancé ${followUps} fois`}
          {followUps >= MAX_FOLLOW_UPS && status === "waiting" && " · plus de relance suggérée"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Statut">
        {(Object.keys(STATUS_LABELS) as ContactStatus[]).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={status === s}
            onClick={() => updateSent(key, { status: s })}
            className={cn(
              "border px-3 py-1.5 text-sm transition-colors",
              status === s ? "border-primary bg-accent font-medium text-primary" : "border-border hover:bg-muted"
            )}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={saveNote}
        maxLength={MAX_NOTE}
        placeholder="Note (ex. rappeler lundi, interlocuteur : M. Koffi)"
        aria-label="Note"
        className="h-10"
      />

      <div className="flex flex-wrap items-center gap-2">
        {status === "waiting" && (
          <Button type="button" onClick={onFollowUp} variant={due ? "default" : "outline"} className="h-9">Relancer</Button>
        )}
        {link && (
          <>
            <Button render={<Link href={`/searches/${link.runId}/results/${link.index}`} />} nativeButton={false} variant="outline" className="h-9">Voir la fiche</Button>
            {messageHref && (
              <Button render={<Link href={messageHref} />} nativeButton={false} variant="outline" className="h-9">
                {pitch ? "Rouvrir la proposition" : "Rouvrir la candidature"}
              </Button>
            )}
          </>
        )}
        <button
          type="button"
          onClick={onDelete}
          aria-label="Retirer du suivi"
          className="ml-auto grid size-9 place-items-center border border-border text-muted-foreground transition-colors hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <IconlyTrash size={18} color="currentColor" />
        </button>
      </div>

      {link === null && (
        <p className="text-xs text-muted-foreground">
          La fiche n&apos;est plus en mémoire : rouvre la recherche depuis l&apos;Historique pour la retrouver.
        </p>
      )}
    </article>
  );
}