"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_SERVICES } from "@/lib/profile-schema";
import type { Service } from "@/types/profile";

export function ServicesEditor({ value, onChange }: { value: Service[]; onChange: (services: Service[]) => void }) {
  const update = (i: number, patch: Partial<Service>) =>
    onChange(value.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Aucun service pour l&apos;instant. Décris ce que tu proposes : une ligne de nom et une ou deux phrases suffisent.
        </p>
      )}

      {value.map((s, i) => (
        <div key={i} className="flex items-start gap-2 border border-border p-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor={`svc-name-${i}`} className="sr-only">Nom du service {i + 1}</Label>
            <Input
              id={`svc-name-${i}`}
              value={s.name}
              onChange={(e) => update(i, { name: e.target.value })}
              maxLength={80}
              placeholder="Ex. Site vitrine pour entreprise"
              className="h-10"
            />
            <Label htmlFor={`svc-desc-${i}`} className="sr-only">Description du service {i + 1}</Label>
            <Textarea
              id={`svc-desc-${i}`}
              value={s.description}
              onChange={(e) => update(i, { description: e.target.value })}
              maxLength={300}
              rows={2}
              placeholder="Ce que tu fais, en une ou deux phrases."
            />
          </div>
          <button
            type="button"
            onClick={() => onChange(value.filter((_, idx) => idx !== i))}
            aria-label={`Retirer le service ${i + 1}`}
            className="grid size-10 shrink-0 place-items-center border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => onChange([...value, { name: "", description: "" }])}
          disabled={value.length >= MAX_SERVICES}
          className="h-9 gap-2"
        >
          <Plus className="size-4" /> Ajouter un service
        </Button>
        <span className="text-xs text-muted-foreground">{value.length} / {MAX_SERVICES}</span>
      </div>
    </div>
  );
}