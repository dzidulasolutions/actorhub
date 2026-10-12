"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  IconlyActivity,
  IconlySearch,
  IconlyDownload,
  IconlyArrowRight,
} from "@/components/icons/iconly";
import { actorFormSchema, normalizeApifyId } from "@/lib/validations";
import { addActor } from "@/lib/local-storage";
import { CATEGORY_LABELS, type ActorCategory } from "@/types/actor";

// ---------- Écran 1 : bienvenue ----------
const FEATURES = [
  { icon: IconlyActivity, title: "Configure", text: "Ajoute les Actors Apify que tu utilises, avec leurs paramètres." },
  { icon: IconlySearch, title: "Collecte", text: "Lance une recherche et suis son avancement en direct." },
  { icon: IconlyDownload, title: "Exporte", text: "Sélectionne les bons résultats et télécharge-les en JSON." },
];

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wider text-highlight">
          Bienvenue
        </p>
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">
          Toutes tes collectes, une seule interface.
        </h1>
        <p className="text-muted-foreground">
          ActorHub centralise tes Actors Apify pour lancer des recherches,
          explorer les résultats et exporter l&apos;essentiel.
        </p>
      </div>

      <ul className="divide-y divide-border border border-border">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-start gap-4 p-4">
            <span className="grid size-10 shrink-0 place-items-center bg-black text-white">
              <Icon size={20} color="currentColor" />
            </span>
            <div>
              <p className="font-medium">{title}</p>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          </li>
        ))}
      </ul>

      <Button size="lg" onClick={onNext} className="h-11 gap-2 px-6">
        Commencer <IconlyArrowRight size={18} color="currentColor" />
      </Button>
    </div>
  );
}

// ---------- Écran 2 : fonctionnement ----------
const HOW = [
  { n: "01", title: "Tu configures un Actor", text: "Nom, identifiant Apify et paramètres d'entrée en JSON." },
  { n: "02", title: "Tu lances la collecte", text: "L'exécution tourne sur Apify ; le statut se met à jour tout seul." },
  { n: "03", title: "Tu explores et exportes", text: "Tableau, filtres, sélection, puis export JSON complet ou partiel." },
];

export function HowItWorksStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wider text-highlight">
          Fonctionnement
        </p>
        <h2 className="font-display text-4xl leading-tight">Trois étapes, rien de plus.</h2>
      </div>

      <ol className="space-y-3">
        {HOW.map((s) => (
          <li key={s.n} className="flex gap-4 border border-border p-4">
            <span className="font-display text-2xl text-primary">{s.n}</span>
            <div>
              <p className="font-medium">{s.title}</p>
              <p className="text-sm text-muted-foreground">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* Rassure l'utilisateur sur la sécurité, point central du cahier des charges */}
      <p className="border-l-2 border-primary bg-accent px-4 py-3 text-sm">
        Ton jeton Apify reste côté serveur : il n&apos;est jamais envoyé au navigateur.
      </p>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="lg" onClick={onBack} className="h-11 gap-2">
          <ArrowLeft className="size-4" /> Retour
        </Button>
        <Button size="lg" onClick={onNext} className="h-11 gap-2 px-6">
          Continuer <IconlyArrowRight size={18} color="currentColor" />
        </Button>
      </div>
    </div>
  );
}

// ---------- Écran 3 : premier Actor ----------
export function FirstActorStep({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const [name, setName] = useState("");
  const [apifyRef, setApifyRef] = useState("");
  const [category, setCategory] = useState<ActorCategory>("maps");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Aperçu de l'identifiant normalisé, affiché dès que la saisie est valide
  const normalized = normalizeApifyId(apifyRef);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = actorFormSchema.safeParse({ name, apifyRef, category });
    if (!result.success) {
      // On garde le premier message par champ
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    addActor({
      id: crypto.randomUUID(),
      name: result.data.name,
      apifyId: normalizeApifyId(result.data.apifyRef)!, // déjà validé par le schéma
      category: result.data.category,
      enabled: true,
      input: {}, // les paramètres se règlent ensuite dans la page Actors
      createdAt: new Date().toISOString(),
    });
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wider text-highlight">
          Premier Actor
        </p>
        <h2 className="font-display text-4xl leading-tight">Ajoute ton premier Actor.</h2>
        <p className="text-muted-foreground">
          Tu pourras en ajouter d&apos;autres et régler ses paramètres plus tard.
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Nom d&apos;affichage</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Ex. Google Maps – entreprises" className="h-11"
            aria-invalid={!!errors.name} />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="apifyRef">Identifiant ou lien Apify</Label>
          <Input id="apifyRef" value={apifyRef} onChange={(e) => setApifyRef(e.target.value)}
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
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="lg" onClick={onBack} className="h-11 gap-2">
          <ArrowLeft className="size-4" /> Retour
        </Button>
        <Button type="submit" size="lg" className="h-11 gap-2 px-6">
          Terminer <IconlyArrowRight size={18} color="currentColor" />
        </Button>
      </div>
    </form>
  );
}