// src/components/letter/improve-panel.tsx
"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { buildLetterImprovePrompt, extractLetterFromAnswer, restorePlaceholders } from "@/lib/ai-prompt";
import type { Language } from "@/lib/cover-letter";
import type { Profile } from "@/types/profile";
import { ChatLinks } from "../results/chat-links";

export function ImprovePanel({
  profile, job, offerDescription, body, language, onApply,
}: {
  profile: Profile;
  job: { title: string | null; company: string | null };
  offerDescription: string | null;
  body: string;
  language: Language;
  onApply: (text: string) => void;
}) {
  const [redact, setRedact] = useState(true);
  const [copied, setCopied] = useState(false);
  const [answer, setAnswer] = useState("");
  const [previous, setPrevious] = useState<string | null>(null); // ta version avant d'appliquer le texte amélioré
  const [error, setError] = useState<string | null>(null);

  const prompt = useMemo(
    () => buildLetterImprovePrompt(profile, { ...job, description: offerDescription }, body, { language, redact }),
    [profile, job, offerDescription, body, language, redact]
  );
  const improved = useMemo(() => restorePlaceholders(extractLetterFromAnswer(answer), profile), [answer, profile]);
  const leftover = /\[(?:Nom|email|téléphone|profil LinkedIn)\]/.test(improved);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Copie impossible : ouvre « Voir la consigne », sélectionne le texte et copie-le à la main.");
    }
  }

  function apply() {
    setPrevious(body);
    onApply(improved);
    setAnswer("");
    setError(null);
  }

  return (
    <section className="min-w-0 space-y-4 border border-border bg-card p-4 sm:p-5">
      <div className="space-y-1">
        <h2 className="font-semibold">Améliorer ma lettre avec une IA gratuite</h2>
        <p className="text-sm text-muted-foreground">
          1. Copie la consigne. 2. Colle-la dans un chat. 3. Recolle sa réponse ici, puis applique-la à ta lettre.
        </p>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" checked={redact} onChange={(e) => setRedact(e.target.checked)} className="size-4 accent-primary" />
        Masquer mon nom, email et téléphone (ils sont remis automatiquement dans le texte amélioré)
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={copyPrompt} className="h-9 gap-2">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Consigne copiée" : "Copier la consigne"}
        </Button>
        <ChatLinks />
      </div>

      <details className="border border-border">
        <summary className="cursor-pointer select-none px-3 py-2 text-sm text-primary hover:underline">
          Voir la consigne ({prompt.text.length.toLocaleString("fr-FR")} caractères) : relis-la avant de la coller
        </summary>
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap wrap-words border-t border-border bg-muted p-3 font-sans text-xs">{prompt.text}</pre>
      </details>

      <div className="space-y-2">
        <label htmlFor="improve-answer" className="text-sm font-medium">Réponse de l&apos;IA</label>
        <Textarea id="improve-answer" value={answer} onChange={(e) => setAnswer(e.target.value)} rows={8} placeholder="Colle ici la réponse du chat (la liste des changements est ignorée)…" />
        {improved && (
          <p className="text-xs text-muted-foreground">
            Texte qui sera appliqué : {improved.length.toLocaleString("fr-FR")} caractères.
            {leftover && " Des éléments entre crochets restent dans le texte : remplace-les à la main après l'avoir appliqué."}
          </p>
        )}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={apply} disabled={improved.length < 50} className="h-9">Utiliser ce texte dans ma lettre</Button>
          {previous !== null && (
            <button type="button" onClick={() => { onApply(previous); setPrevious(null); }} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <Undo2 className="size-3.5" /> Revenir à ma version précédente
            </button>
          )}
        </div>
      </div>

      <p className="border-l-2 border-primary bg-accent px-4 py-3 text-xs">
        Relis la lettre améliorée : une IA peut ajouter des détails qui ne sont pas dans ton CV, et tu signes ce que tu envoies.
      </p>
    </section>
  );
}