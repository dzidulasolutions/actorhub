"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IconlyArrowRight } from "@/components/icons/iconly";
import { parseActorInput } from "@/lib/validations";
import { startSearch } from "@/lib/searches-store";
import type { ActorConfig } from "@/types/actor";

type Errors = { input?: string; maxItems?: string; submit?: string };

// Rendu avec key={actor.id} par la page : l'état repart à zéro quand on change d'Actor
export function SearchForm({ actor }: { actor: ActorConfig }) {
  const router = useRouter();
  const [inputText, setInputText] = useState(() => JSON.stringify(actor.input, null, 2));
  const [maxItems, setMaxItems] = useState("50");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  // Récapitulatif "à vérifier avant lancement", recalculé à chaque frappe
  const parsed = parseActorInput(inputText);
  const fieldCount = parsed.ok ? Object.keys(parsed.value).length : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const max = Number(maxItems);
    const next: Errors = {};
    if (!parsed.ok) next.input = parsed.error;
    if (!Number.isInteger(max) || max < 1 || max > 1000) next.maxItems = "Entre 1 et 1000";
    setErrors(next);
    if (!parsed.ok || next.maxItems) return;

    setSubmitting(true);
    try {
      const id = await startSearch(actor, parsed.value, max);
      router.push(`/searches/${id}`); // page de suivi
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : "Lancement impossible" });
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="s-input">2. Paramètres de la recherche (JSON)</Label>
          <Textarea id="s-input" value={inputText} onChange={(e) => setInputText(e.target.value)}
            spellCheck={false} rows={12} aria-invalid={!!errors.input}
            className="font-mono text-sm" />
          {errors.input && <p className="text-sm text-destructive">{errors.input}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="s-max">Limite de résultats</Label>
          <Input id="s-max" inputMode="numeric" value={maxItems}
            onChange={(e) => setMaxItems(e.target.value)} aria-invalid={!!errors.maxItems}
            className="h-11 w-40" />
          {errors.maxItems && <p className="text-sm text-destructive">{errors.maxItems}</p>}
          <p className="text-xs text-muted-foreground">
            S&apos;applique aux Actors facturés au résultat. Pour les autres, limite aussi le
            nombre de résultats dans le JSON (ex. <code className="font-mono">maxCrawledPlacesPerSearch</code>).
          </p>
        </div>
      </div>

      {/* Récapitulatif : la "vérification avant exécution" du cahier des charges */}
      <aside className="h-fit space-y-4 border border-border p-4 lg:sticky lg:top-6">
        <h2 className="text-sm font-semibold">Vérifier avant de lancer</h2>
        <dl className="space-y-3 text-sm">
          <Row label="Actor" value={actor.name} />
          <Row label="Identifiant" value={actor.apifyId} mono />
          <Row
            label="Paramètres"
            value={parsed.ok ? `${fieldCount} champ${fieldCount > 1 ? "s" : ""}` : "JSON invalide"}
            danger={!parsed.ok}
          />
          <Row label="Limite" value={maxItems || "—"} />
        </dl>
        <p className="text-xs text-muted-foreground">
          Un plafond de budget par run est appliqué côté serveur.
        </p>
        {errors.submit && (
          <p role="alert" className="border-l-2 border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errors.submit}
          </p>
        )}
        <Button type="submit" disabled={submitting} className="h-11 w-full gap-2">
          {submitting ? "Lancement…" : <>Lancer la recherche <IconlyArrowRight size={18} color="currentColor" /></>}
        </Button>
      </aside>
    </form>
  );
}

function Row({ label, value, mono, danger }: { label: string; value: string; mono?: boolean; danger?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`truncate text-right ${mono ? "font-mono text-xs" : ""} ${danger ? "text-destructive" : ""}`}>
        {value}
      </dd>
    </div>
  );
}