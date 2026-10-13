"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Globe, ImageOff, Mail, Phone, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { hostOf } from "@/lib/normalize-results";
import type { NormalizedResult, SocialNetwork } from "@/types/results";

const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "X",
  youtube: "YouTube",
  tiktok: "TikTok",
};

// Tout le contenu vient d'Apify : il est affiché comme du TEXTE (React l'échappe), jamais comme du HTML.
export function ResultCard({
  result,
  selected,
  onToggle,
}: {
  result: NormalizedResult;
  selected: boolean;
  onToggle: () => void;
}) {
  const { emails, phones, website, socials } = result;
  const [imageBroken, setImageBroken] = useState(false);

  // Titre de repli : site web, puis numéro dans la collecte
  const name = result.title ?? hostOf(website) ?? `Résultat n°${result.index + 1}`;
  const permanentlyClosed = result.raw.permanentlyClosed === true;
  const temporarilyClosed = result.raw.temporarilyClosed === true;

  return (
    <article
      className={cn(
        "flex flex-col border bg-card transition-colors",
        selected ? "border-primary ring-1 ring-primary" : "border-border"
      )}
    >
      {/* Image + sélection + badges */}
      <div className="relative aspect-4/3 bg-muted">
        {result.image && !imageBroken ? (
          // <img> volontaire : les images viennent de domaines variés selon l'Actor
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={result.image}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageBroken(true)}
            className="size-full object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <ImageOff className="size-8" />
          </div>
        )}
        <div className="absolute left-2 top-2">
          <SelectBox checked={selected} onChange={onToggle} label={`Sélectionner ${name}`} />
        </div>
        {(permanentlyClosed || temporarilyClosed) && (
          <span className="absolute right-2 top-2 bg-destructive px-2 py-1 text-xs font-medium text-white">
            {permanentlyClosed ? "Fermé définitivement" : "Fermé temporairement"}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1.5">
          <h3 className="line-clamp-2 font-medium leading-snug">{name}</h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {result.category && <span>{result.category}</span>}
            {result.rating !== null && (
              <span className="inline-flex items-center gap-1">
                <Star className="size-3.5 fill-highlight text-highlight" />
                <span className="font-medium text-foreground">{result.rating.toFixed(1)}</span>
                {result.reviewsCount !== null && <span>({result.reviewsCount})</span>}
              </span>
            )}
          </div>
          {result.subtitle && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{result.subtitle}</p>
          )}
        </div>

        {/* Bloc contact : email en premier, c'est l'info clé */}
        <div className="mt-auto space-y-2 border-t border-border pt-3 text-sm">
          {emails.length > 0 ? (
            <div className="flex items-center gap-2">
              <Mail className="size-4 shrink-0 text-primary" />
              <a href={`mailto:${emails[0]}`} className="min-w-0 flex-1 truncate font-medium hover:underline">
                {emails[0]}
              </a>
              {emails.length > 1 && (
                <span className="shrink-0 text-xs text-muted-foreground">+{emails.length - 1}</span>
              )}
              <CopyButton value={emails[0]} label="Copier l'email" />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="size-4 shrink-0" /> Aucun email trouvé
            </div>
          )}

          {phones.length > 0 && (
            <div className="flex items-center gap-2">
              <Phone className="size-4 shrink-0 text-muted-foreground" />
              <a href={`tel:${phones[0].replace(/[^\d+]/g, "")}`} className="truncate hover:underline">
                {phones[0]}
              </a>
              {phones.length > 1 && (
                <span className="text-xs text-muted-foreground">+{phones.length - 1}</span>
              )}
            </div>
          )}

          {website && (
            <div className="flex items-center gap-2">
              <Globe className="size-4 shrink-0 text-muted-foreground" />
              <a href={website} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate hover:underline">
                {hostOf(website)}
              </a>
              {result.websiteIsDirectory && (
                <span className="shrink-0 bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">Annuaire</span>
              )}
            </div>
          )}

          {socials.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {socials.slice(0, 4).map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 border border-border px-2 py-0.5 text-xs transition-colors hover:bg-accent hover:text-primary"
                >
                  {SOCIAL_LABELS[s.network]} <ExternalLink className="size-3" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// Case à cocher carrée (le composant shadcn arrondit ses coins)
function SelectBox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "grid size-7 place-items-center border shadow-card transition-colors",
        checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"
      )}
    >
      {checked && <Check className="size-4" />}
    </button>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {
      /* presse-papiers indisponible : on ne fait rien */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      title={label}
      className="grid size-7 shrink-0 place-items-center text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
    >
      {done ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
    </button>
  );
}