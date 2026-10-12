"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { actorFormSchema, normalizeApifyId, parseActorInput } from "@/lib/validations";
import type { ActorDraft } from "@/hooks/use-actors";
import { CATEGORY_LABELS, type ActorCategory, type ActorConfig } from "@/types/actor";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actor: ActorConfig | null; // null = création
  onSubmit: (draft: ActorDraft) => void;
};

export function ActorFormSheet({ open, onOpenChange, actor, onSubmit }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border p-6">
          <SheetTitle className="text-lg">
            {actor ? "Modifier l'Actor" : "Ajouter un Actor"}
          </SheetTitle>
          <SheetDescription>
            Chaque Actor a ses propres paramètres : renseigne son entrée en JSON.
          </SheetDescription>
        </SheetHeader>
        {/* Le formulaire n'existe que quand le tiroir est ouvert : son état repart à zéro à chaque ouverture */}
        {open && (
          <ActorForm
            actor={actor}
            onCancel={() => onOpenChange(false)}
            onSubmit={(d) => {
              onSubmit(d);
              onOpenChange(false);
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ActorForm({
  actor,
  onSubmit,
  onCancel,
}: {
  actor: ActorConfig | null;
  onSubmit: (draft: ActorDraft) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(actor?.name ?? "");
  const [apifyRef, setApifyRef] = useState(actor?.apifyId ?? "");
  const [category, setCategory] = useState<ActorCategory>(actor?.category ?? "maps");
  const [description, setDescription] = useState(actor?.description ?? "");
  const [inputText, setInputText] = useState(
    actor ? JSON.stringify(actor.input, null, 2) : "{}"
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const normalized = normalizeApifyId(apifyRef);

  // Remet le JSON en forme lisible ; signale l'erreur s'il est invalide
  function formatJson() {
    const r = parseActorInput(inputText);
    if (r.ok) {
      setInputText(JSON.stringify(r.value, null, 2));
      setErrors((e) => ({ ...e, input: "" }));
    } else setErrors((e) => ({ ...e, input: r.error }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};

    const base = actorFormSchema.safeParse({ name, apifyRef, category, description });
    if (!base.success) {
      for (const i of base.error.issues) {
        const k = String(i.path[0]);
        if (!next[k]) next[k] = i.message;
      }
    }
    const input = parseActorInput(inputText);
    if (!input.ok) next.input = input.error;

    setErrors(next);
    if (!base.success || !input.ok) return;

    onSubmit({
      name: base.data.name,
      apifyId: normalizeApifyId(base.data.apifyRef)!, // déjà validé par le schéma
      category: base.data.category,
      description: base.data.description || undefined,
      input: input.value,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-1 flex-col">
      <div className="flex-1 space-y-5 p-6">
        <div className="space-y-2">
          <Label htmlFor="f-name">Nom d&apos;affichage</Label>
          <Input id="f-name" value={name} onChange={(e) => setName(e.target.value)}
            className="h-11" aria-invalid={!!errors.name} />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="f-ref">Identifiant ou lien Apify</Label>
          <Input id="f-ref" value={apifyRef} onChange={(e) => setApifyRef(e.target.value)}
            placeholder="utilisateur/nom-de-l-actor" className="h-11 font-mono text-sm"
            aria-invalid={!!errors.apifyRef} />
          {errors.apifyRef ? (
            <p className="text-sm text-destructive">{errors.apifyRef}</p>
          ) : normalized ? (
            <p className="font-mono text-xs text-success">→ {normalized}</p>
          ) : null}
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Catégorie</legend>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(CATEGORY_LABELS) as ActorCategory[]).map((c) => (
              <button type="button" key={c} onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={cn(
                  "border px-3 py-2.5 text-left text-sm transition-colors",
                  category === c
                    ? "border-primary bg-accent font-medium text-primary"
                    : "border-border hover:bg-muted"
                )}>
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="f-desc">Description <span className="text-muted-foreground">(facultatif)</span></Label>
          <Input id="f-desc" value={description} onChange={(e) => setDescription(e.target.value)}
            className="h-11" aria-invalid={!!errors.description} />
          {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="f-input">Entrée de l&apos;Actor (JSON)</Label>
            <button type="button" onClick={formatJson}
              className="text-xs text-primary hover:underline">
              Formater
            </button>
          </div>
          <Textarea id="f-input" value={inputText} onChange={(e) => setInputText(e.target.value)}
            spellCheck={false} rows={10} aria-invalid={!!errors.input}
            className="font-mono text-sm" />
          {errors.input && <p className="text-sm text-destructive">{errors.input}</p>}
          <p className="text-xs text-muted-foreground">
            Copie ici l&apos;entrée d&apos;exemple de la page de l&apos;Actor sur Apify.
          </p>
        </div>
      </div>

      {/* Barre d'actions collée en bas du tiroir */}
      <div className="sticky bottom-0 flex justify-end gap-3 border-t border-border bg-card p-4">
        <Button type="button" variant="outline" onClick={onCancel} className="h-10">
          Annuler
        </Button>
        <Button type="submit" className="h-10 px-6">
          {actor ? "Enregistrer" : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}