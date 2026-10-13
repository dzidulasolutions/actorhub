"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft, Check, ChevronLeft, ChevronRight, Clock, ExternalLink,
  Globe, ImageOff, Mail, MapPin, Phone, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { useIsClient } from "@/hooks/use-is-client";
import { useSearch } from "@/hooks/use-searches";
import { useExplorerState } from "@/hooks/use-explorer-state";
import { hostOf, normalizeResult } from "@/lib/normalize-results";
import { cn } from "@/lib/utils";
import type { SocialNetwork } from "@/types/results";
import { CopyButton } from "./result-card";
import { isEmptyValue, JsonValue } from "./json-tree";
import { ResultDetailSkeleton } from "./result-detail-skeleton";

const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  linkedin: "LinkedIn", facebook: "Facebook", instagram: "Instagram",
  twitter: "X", youtube: "YouTube", tiktok: "TikTok",
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

// Lien Google Maps construit par NOTRE code à partir des coordonnées (jamais d'URL externe)
function mapsLink(raw: Record<string, unknown>): string | null {
  const loc = raw.location;
  if (isRecord(loc) && typeof loc.lat === "number" && typeof loc.lng === "number") {
    return `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`;
  }
  return null;
}

// Horaires au format [{ day, hours }] (Google Maps) ; null si le format est différent
function openingHours(raw: Record<string, unknown>): { day: string; hours: string }[] | null {
  const v = raw.openingHours;
  if (!Array.isArray(v) || v.length === 0) return null;
  const rows = v.filter(
    (x): x is { day: string; hours: string } =>
      isRecord(x) && typeof x.day === "string" && typeof x.hours === "string"
  );
  return rows.length === v.length ? rows : null;
}

const toCopy = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v, null, 2));

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 ">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ icon: Icon, children }: { icon: typeof Mail; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <Icon className="size-4 shrink-0" /> {children}
    </div>
  );
}

export function ResultDetail({ runId, index }: { runId: string; index: number }) {
  const ready = useIsClient();
  const search = useSearch(runId);
  const [ui, setUi] = useExplorerState(runId);
  const [imageBroken, setImageBroken] = useState(false);
  const [hideEmpty, setHideEmpty] = useState(true);
  const [showRaw, setShowRaw] = useState(false);

  const total = search?.items?.length ?? 0;
  const item = search?.items?.[index];
  const result = useMemo(
    () => (item === undefined ? null : normalizeResult(item, index)),
    [item, index]
  );

  if (!ready) return <ResultDetailSkeleton />;
  // Résultats pas encore récupérés : on garde le skeleton
  if (search && search.items === null && !search.error) return <ResultDetailSkeleton />;

  if (!search || !result) {
    return (
      <>
        <PageHeader title="Résultat introuvable" />
        <div className="grid place-items-center gap-4 p-10 text-center">
          <p className="max-w-md text-sm text-muted-foreground">
            Ce résultat n&apos;est plus en mémoire (la page a été rechargée) ou n&apos;existe pas.
          </p>
          <Button
            render={<Link href={search ? `/searches/${runId}` : "/searches/new"} />}
            nativeButton={false}
            className="h-10"
          >
            {search ? "Retour aux résultats" : "Nouvelle recherche"}
          </Button>
        </div>
      </>
    );
  }

  const { raw, emails, phones, website, socials } = result;
  const name = result.title ?? hostOf(website) ?? `Résultat n°${index + 1}`;
  const selected = ui.selected.has(index);
  const maps = mapsLink(raw);
  const hours = openingHours(raw);
  const closed =
    raw.permanentlyClosed === true ? "Fermé définitivement"
      : raw.temporarilyClosed === true ? "Fermé temporairement" : null;

  const toggleSelected = () =>
    setUi((s) => {
      const next = new Set(s.selected);
      if (!next.delete(index)) next.add(index);
      return { selected: next };
    });

  const fields = Object.entries(raw).filter(([, v]) => !(hideEmpty && isEmptyValue(v)));
  const hiddenCount = Object.keys(raw).length - fields.length;
  const base = `/searches/${runId}`;

  return (
    <>
      <PageHeader
        title={name}
        description={`Résultat ${index + 1} sur ${total}`}
        actions={
          <>
            <Button
              variant="outline"
              size="icon"
              disabled={index <= 0}
              render={<Link href={`${base}/results/${index - 1}`} />}
              nativeButton={false}
              aria-label="Résultat précédent"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={index >= total - 1}
              render={<Link href={`${base}/results/${index + 1}`} />}
              nativeButton={false}
              aria-label="Résultat suivant"
            >
              <ChevronRight className="size-4" />
            </Button>
          </>
        }
      />

      <div className="space-y-6 p-5 sm:p-6">
        <Link href={base} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" /> Retour aux résultats
        </Link>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">

          {/* ===== Colonne principale ===== */}
          <div className="min-w-0 space-y-6">
            <Section title="Contact">
              <div className="space-y-3">
                {emails.length > 0 ? (
                  emails.map((e) => (
                    <div key={e} className="flex items-center gap-3 text-sm">
                      <Mail className="size-4 shrink-0 text-primary" />
                      <a href={`mailto:${e}`} className="min-w-0 flex-1 truncate font-medium hover:underline">{e}</a>
                      <CopyButton value={e} label="Copier l'email" />
                    </div>
                  ))
                ) : (
                  <Empty icon={Mail}>Aucun email trouvé</Empty>
                )}

                {phones.length > 0 ? (
                  phones.map((p) => (
                    <div key={p} className="flex items-center gap-3 text-sm">
                      <Phone className="size-4 shrink-0 text-muted-foreground" />
                      <a href={`tel:${p.replace(/[^\d+]/g, "")}`} className="min-w-0 flex-1 truncate hover:underline">{p}</a>
                      <CopyButton value={p} label="Copier le numéro" />
                    </div>
                  ))
                ) : (
                  <Empty icon={Phone}>Aucun téléphone</Empty>
                )}

                {website ? (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="size-4 shrink-0 text-muted-foreground" />
                    <a href={website} target="_blank" rel="noopener noreferrer" title={website} className="min-w-0 flex-1 truncate hover:underline">{website}</a>                    {result.websiteIsDirectory && (
                      <span className="shrink-0 bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">Annuaire</span>
                    )}
                    <CopyButton value={website} label="Copier le lien" />
                  </div>
                ) : (
                  <Empty icon={Globe}>Aucun site web</Empty>
                )}
              </div>

              {socials.length > 0 && (
                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  {socials.map((s) => (
                    <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-primary">
                      {SOCIAL_LABELS[s.network]} <ExternalLink className="size-3.5" />
                    </a>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Informations">
              <dl className="space-y-3 text-sm">
                {closed && (
                  <div className="border-l-2 border-destructive bg-destructive/10 px-3 py-2 text-destructive">{closed}</div>
                )}
                {result.category && <Row label="Catégorie">{result.category}</Row>}
                {result.rating !== null && (
                  <Row label="Note">
                    <span className="inline-flex items-center gap-1.5">
                      <Star className="size-4 fill-highlight text-highlight" />
                      <span className="font-medium">{result.rating.toFixed(1)}</span>
                      {result.reviewsCount !== null && (
                        <span className="text-muted-foreground">· {result.reviewsCount} avis</span>
                      )}
                    </span>
                  </Row>
                )}
                {result.subtitle && (
                  <Row label="Adresse">
                    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                      {result.subtitle}
                      {maps && (
                        <a href={maps} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                          <MapPin className="size-3.5" /> Voir sur la carte
                        </a>
                      )}
                    </span>
                  </Row>
                )}
                {result.description && <Row label="Description">{result.description}</Row>}
                {result.date && <Row label="Date">{result.date}</Row>}
              </dl>

              {hours && (
                <div className="space-y-2 border-t border-border pt-4">
                  <p className="flex items-center gap-2 text-sm font-medium"><Clock className="size-4" /> Horaires</p>
                    <div className="grid gap-1 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-4">
                    {hours.map((h) => (
                      <div key={h.day} className="contents">
                        <dt className="capitalize text-muted-foreground">{h.day}</dt>
                        <dd>{h.hours}</dd>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            <Section title="Toutes les données">
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={hideEmpty} onChange={(e) => setHideEmpty(e.target.checked)} className="size-4 accent-primary" />
                  Masquer les champs vides
                  {hideEmpty && hiddenCount > 0 && <span className="text-muted-foreground">({hiddenCount} masqués)</span>}
                </label>
                <button type="button" onClick={() => setShowRaw((v) => !v)} className="text-primary hover:underline">
                  {showRaw ? "Masquer le JSON brut" : "Afficher le JSON brut"}
                </button>
              </div>

              {showRaw ? (
                // Calculé seulement à l'affichage : le JSON peut être volumineux
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <CopyButton value={JSON.stringify(raw, null, 2)} label="Copier tout le JSON" />
                  </div>
                  <pre className="max-h-128 overflow-auto bg-muted p-4 font-mono text-xs">{JSON.stringify(raw, null, 2)}</pre>
                </div>
              ) : (
                <dl className="divide-y divide-border">
                  {fields.map(([key, value]) => (
                    <div key={key} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)_auto] sm:gap-4">
                      <dt className="wrap-words font-mono text-xs text-muted-foreground">{key}</dt>
                      <dd className="min-w-0 text-sm"><JsonValue value={value} /></dd>
                      <div className="sm:justify-self-end">
                        <CopyButton value={toCopy(value)} label={`Copier « ${key} »`} />
                      </div>
                    </div>
                  ))}
                </dl>
              )}
            </Section>
          </div>

          {/* ===== Colonne latérale ===== */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
            <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
              {result.image && !imageBroken ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={result.image} alt="" referrerPolicy="no-referrer" onError={() => setImageBroken(true)} className="absolute inset-0 size-full object-cover" />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-muted-foreground"><ImageOff className="size-8" /></div>
              )}
            </div>

            <Button
              type="button"
              onClick={toggleSelected}
              variant={selected ? "outline" : "default"}
              className={cn("h-10 w-full gap-2", selected && "border-primary text-primary")}
            >
              {selected ? <><Check className="size-4" /> Dans la sélection</> : "Ajouter à la sélection"}
            </Button>

            {result.url && (
              <Button variant="outline" className="h-10 w-full gap-2" render={<a href={result.url} target="_blank" rel="noopener noreferrer" />} nativeButton={false}>
                Ouvrir la source <ExternalLink className="size-4" />
              </Button>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[120px_1fr] sm:gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 wrap-words">{children}</dd>
    </div>
  );
}