"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { IconlyPlus, IconlyActivity } from "@/components/icons/iconly";
import { useActors } from "@/hooks/use-actors";
import type { ActorConfig } from "@/types/actor";
import { ActorCard } from "./actor-card";
import { ActorFormSheet } from "./actor-form-sheet";
import { ActorsSkeleton } from "./actors-skeleton";

export function ActorsPage() {
  const { actors, ready, add, update, toggle, remove } = useActors();
  // sheet.actor = null → création ; sinon modification de cet Actor
  const [sheet, setSheet] = useState<{ open: boolean; actor: ActorConfig | null }>({
    open: false,
    actor: null,
  });
  const [toDelete, setToDelete] = useState<ActorConfig | null>(null);

  if (!ready) return <ActorsSkeleton />;

  const addButton = (
    <Button onClick={() => setSheet({ open: true, actor: null })} className="h-9 gap-2">
      <IconlyPlus size={18} color="currentColor" /> Ajouter un Actor
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Actors"
        description="Les Actors Apify que tu utilises pour tes collectes"
        actions={addButton}
      />

      <div className="p-5 sm:p-6">
        {actors.length === 0 ? (
          // État vide : explique et propose l'action principale
          <div className="grid place-items-center gap-4 border border-dashed border-border px-6 py-16 text-center">
            <span className="grid size-12 place-items-center bg-black text-white">
              <IconlyActivity size={24} color="currentColor" />
            </span>
            <div className="space-y-1">
              <p className="font-medium">Aucun Actor configuré</p>
              <p className="text-sm text-muted-foreground">
                Ajoute ton premier Actor pour pouvoir lancer une recherche.
              </p>
            </div>
            {addButton}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {actors.map((a) => (
              <ActorCard
                key={a.id}
                actor={a}
                onToggle={() => toggle(a.id)}
                onEdit={() => setSheet({ open: true, actor: a })}
                onDelete={() => setToDelete(a)}
              />
            ))}
          </div>
        )}

        {/* Avertissement demandé par le cahier des charges : données locales */}
        <p className="mt-6 text-xs text-muted-foreground">
          Ces Actors sont enregistrés dans ce navigateur. Ils seront perdus si tu
          vides les données du navigateur.
        </p>
      </div>

      <ActorFormSheet
        open={sheet.open}
        onOpenChange={(open) => setSheet((s) => ({ ...s, open }))}
        actor={sheet.actor}
        onSubmit={(draft) => (sheet.actor ? update(sheet.actor.id, draft) : add(draft))}
      />

      {/* Confirmation avant suppression : action irréversible */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {toDelete?.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Sa configuration sera effacée de ce navigateur. L&apos;Actor lui-même
              reste intact sur Apify.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toDelete && remove(toDelete.id)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}