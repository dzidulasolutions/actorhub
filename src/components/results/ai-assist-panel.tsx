"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useJobNote } from "@/hooks/use-job-note";
import { buildAnalysisPrompt } from "@/lib/ai-prompt";
import type { Language } from "@/lib/cover-letter";
import { jobKey, MAX_NOTE_CHARS } from "@/lib/job-notes";
import { deleteNote, saveNote } from "@/lib/job-notes-store";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/profile";
import type { NormalizedResult } from "@/types/results";

const CHATS = [
  { label: "Claude", href: "https://claude.ai/new" },
  { label: "ChatGPT", href: "https://chatgpt.com/" },
  { label: "Gemini", href: "https://gemini.google.com/app" },
];

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

export function AiAssistPanel({ result, profile }: { result: NormalizedResult; profile: Profile }) {
  const key = jobKey(result);
  const note = useJobNote(key);

  const [language, setLanguage] = useState<Language>("fr");
  const [redact, setRedact] = useState(true);
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState(() => note?.text ?? "");
  const [error, setError] = useState<string | null>(null);

  const prompt = useMemo(() => buildAnalysisPrompt(profile, result, { language, redact }), [profile, result, language, redact]);
  const dirty = draft.trim() !== (note?.text ?? "");
  const noCv = profile.cvText.trim() === "";

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Copie impossible : ouvre « Voir la consigne », sélectionne le texte et copie-le à la main.");
    }
  }

  function save() {
    setError(null);
    if (!saveNote(key, draft.trim())) setError("Enregistrement impossible : le stockage du navigateur est plein ou désactivé.");
  }

  function remove() {
    deleteNote(key);
    setDraft("");
    setError(null);
  }

  return (
    <section className="min-w-0 space-y-4 border border-border bg-card p-4 sm:p-5">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold">Analyse avec une IA gratuite</h2>
        <p className="text-sm text-muted-foreground">
          1. Copie la consigne. 2. Colle-la dans le chat de ton choix. 3. Recolle sa réponse ci-dessous pour la garder avec l&apos;offre.
        </p>
      </div>

      {noCv && (
        <p className="border-l-2 border-highlight bg-highlight/10 px-4 py-3 text-sm">
          Ton CV n&apos;est pas renseigné : l&apos;analyse sera pauvre.{" "}
          <Link href="/profile" className="text-primary hover:underline">Ajouter mon CV</Link>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
        <fieldset className="flex items-center gap-2">
          <legend className="sr-only">Langue de la réponse</legend>
          <span className="text-muted-foreground">Réponse en</span>
          {(["fr", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={language === l}
              onClick={() => setLanguage(l)}
              className={cn("border px-3 py-1", language === l ? "border-primary bg-accent font-medium text-primary" : "border-border hover:bg-muted")}
            >
              {l === "fr" ? "Français" : "English"}
            </button>
          ))}
        </fieldset>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={redact} onChange={(e) => setRedact(e.target.checked)} className="size-4 accent-primary" />
          Masquer mon nom, email et téléphone
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={copyPrompt} className="h-9 gap-2">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Consigne copiée" : "Copier la consigne"}
        </Button>
        {CHATS.map((c) => (
          <Button key={c.label} variant="outline" className="h-9 gap-1.5" render={<a href={c.href} target="_blank" rel="noopener noreferrer" />} nativeButton={false}>
            {c.label} <ExternalLink className="size-3.5" />
          </Button>
        ))}
      </div>

      {(prompt.cvTruncated || prompt.offerTruncated) && (
        <p className="text-xs text-muted-foreground">
          {prompt.cvTruncated && "Ton CV est long : seul son début est inclus. "}
          {prompt.offerTruncated && "La description de l'offre est longue : elle est coupée. "}
        </p>
      )}

      <details className="border border-border">
        <summary className="cursor-pointer select-none px-3 py-2 text-sm text-primary hover:underline">
          Voir la consigne ({prompt.text.length.toLocaleString("fr-FR")} caractères) : relis-la avant de la coller
        </summary>
        {/* Affichée comme du TEXTE : jamais interprétée comme du HTML */}
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap wrap-words border-t border-border bg-muted p-3 font-sans text-xs">{prompt.text}</pre>
      </details>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="ai-answer" className="text-sm font-medium">Réponse de l&apos;IA</label>
          {note && <span className="text-xs text-muted-foreground">Enregistrée le {dateFormat.format(new Date(note.updatedAt))}</span>}
        </div>
        <Textarea
          id="ai-answer"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={10}
          maxLength={MAX_NOTE_CHARS}
          placeholder="Colle ici la réponse du chat…"
        />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={save} disabled={!dirty || draft.trim() === ""} className="h-9">Enregistrer</Button>
          {(note || draft) && (
            <button type="button" onClick={remove} className="text-sm text-muted-foreground hover:text-destructive">
              Effacer l&apos;analyse
            </button>
          )}
        </div>
      </div>

      <p className="border-l-2 border-primary bg-accent px-4 py-3 text-xs">
        Ce que tu colles dans un chat est soumis aux règles de ce service. Vérifie toujours la réponse : une IA peut se tromper.
      </p>
    </section>
  );
}