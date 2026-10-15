"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Copy, ExternalLink, Globe, ImageOff, Mail, Phone, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { hostOf } from "@/lib/normalize-results";
import type { NormalizedResult, ResultKind, SocialNetwork } from "@/types/results";
import { imageBg, imageFit } from "./image-fit";

const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "X",
  youtube: "YouTube",
  tiktok: "TikTok",
};

export const KIND_LABELS: Record<ResultKind, string | null> = {
  place: "Lieu",
  job: "Offre d'emploi",
  profile: "Profil",
  video: "Vidéo",
  other: null,
};

// UTC : une date « 2023-08-16 » s'affiche le 16 quel que soit le fuseau du navigateur
const dayFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "UTC" });
export function fmtDay(iso: string | null): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? iso : dayFormat.format(t);
}

// Tout le contenu vient d'Apify : il est affiché comme du TEXTE (React l'échappe), jamais comme du HTML.
export function ResultCard({
  result,
  href,
  selected,
  onToggle,
}: {
  result: NormalizedResult;
  href: string; // page de détail
  selected: boolean;
  onToggle: () => void;
}) {
  const { kind, emails, phones, website, socials, facts, badges } = result;
  const [imageBroken, setImageBroken] = useState(false);

  // Titre de repli : site web, puis numéro dans la collecte
  const name = result.title ?? hostOf(website) ?? `Résultat n°${result.index + 1}`;
  const permanentlyClosed = result.raw.permanentlyClosed === true;
  const temporarilyClosed = result.raw.temporarilyClosed === true;
  const kindLabel = KIND_LABELS[kind];
  const published = kind === "job" || kind === "video" ? fmtDay(result.date) : null;

  // Lieux et fiches inconnues : le bloc contact est toujours affiché (« Aucun email trouvé »).
  // Offres, profils et vidéos : on n'affiche que ce qui existe, pour ne pas répéter « aucun email » partout.
  const alwaysShowContact = kind === "place" || kind === "other";
  const showContact =
    alwaysShowContact || emails.length > 0 || phones.length > 0 || website !== null || socials.length > 0;

  return (
    <article
      className={cn(
        "flex flex-col border bg-card transition-colors",
        selected ? "border-primary ring-1 ring-primary" : "border-border"
      )}
    >
      {/* Image : boîte au ratio fixe 4:3 ; l'image est en position absolue pour ne jamais
          influencer la hauteur de la boîte, quelles que soient ses dimensions d'origine. */}
      <div className={cn("relative aspect-[4/3] w-full shrink-0 overflow-hidden", imageBg(kind))}>
        <Link href={href} aria-label={`Voir la fiche de ${name}`} className="absolute inset-0 block">
          {result.image && !imageBroken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={result.image}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImageBroken(true)}
              className={cn("absolute inset-0 size-full", imageFit(kind))}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              <ImageOff className="size-8" />
            </div>
          )}
        </Link>
        <div className="absolute left-2 top-2 z-10">
          <SelectBox checked={selected} onChange={onToggle} label={`Sélectionner ${name}`} />
        </div>
        {(permanentlyClosed || temporarilyClosed) && (
          <span className="pointer-events-none absolute right-2 top-2 bg-destructive px-2 py-1 text-xs font-medium text-white">
            {permanentlyClosed ? "Fermé définitivement" : "Fermé temporairement"}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1.5">
          {kindLabel && (
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{kindLabel}</p>
          )}
          <h3 className="line-clamp-2 font-medium leading-snug">
            <Link href={href} className="hover:text-primary hover:underline">{name}</Link>
          </h3>
          {result.tagline && <p className="line-clamp-2 text-sm">{result.tagline}</p>}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {result.category && <span className="line-clamp-1">{result.category}</span>}
            {result.rating !== null && (
              <span className="inline-flex items-center gap-1">
                <Star className="size-3.5 fill-highlight text-highlight" />
                <span className="font-medium text-foreground">{result.rating.toFixed(1)}</span>
                {result.reviewsCount !== null && <span>({result.reviewsCount})</span>}
              </span>
            )}
          </div>
          {result.subtitle && <p className="line-clamp-2 text-sm text-muted-foreground">{result.subtitle}</p>}
          {published && (
            <p className="text-xs text-muted-foreground">
              {kind === "video" ? "Publiée" : "Publiée"} le {published}
            </p>
          )}
        </div>

        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {badges.slice(0, 3).map((b) => (
              <span key={b} className="bg-accent px-2 py-0.5 text-xs text-primary">{b}</span>
            ))}
          </div>
        )}

        {/* Statistiques propres au type : salaire/contrat (offre), relations (profil), vues (vidéo)… */}
        {facts.length > 0 && (
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border pt-3">
            {facts.slice(0, 4).map((f) => (
              <div key={f.label} className="min-w-0">
                <dt className="text-xs text-muted-foreground">{f.label}</dt>
                <dd className="truncate text-sm font-medium" title={f.value}>{f.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {kind !== "place" && result.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{result.description}</p>
        )}

        {/* Bloc contact : email en premier, c'est l'info clé */}
        {showContact && (
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
              alwaysShowContact && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-4 shrink-0" /> Aucun email trouvé
                </div>
              )
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
        )}
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

export function CopyButton({ value, label }: { value: string; label: string }) {
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