import type { NormalizedResult } from "@/types/results";

export type SortKey = "default" | "name" | "rating" | "reviews" | "date" | "match";


export const SORT_LABELS: Record<SortKey, string> = {
  default: "Ordre de collecte",
  name: "Nom (A → Z)",
  rating: "Meilleure note",
  reviews: "Plus d'avis",
  date: "Plus récents",
  match: "Meilleur score",
};

export interface Filters {
  withEmail: boolean;
  withPhone: boolean;
  withWebsite: boolean;
  withSocial: boolean;
  goodMatch: boolean; // score de correspondance d'au moins GOOD_MATCH
    analyzed: boolean; // offres dont tu as enregistré une analyse

}

export const NO_FILTERS: Filters = {
  withEmail: false,
  withPhone: false,
  withWebsite: false,
  withSocial: false,
  goodMatch: false,
  analyzed: false,
};

export type ScoreOf = (r: NormalizedResult) => number | null;
export type IsAnalyzed = (r: NormalizedResult) => boolean;
export const GOOD_MATCH = 60;

// Minuscules et sans accents : "hotel" trouve "Hôtel"
export const fold = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Texte de recherche d'un résultat : champs standard + valeurs texte du premier niveau de l'objet original
const cache = new WeakMap<NormalizedResult, string>();

function searchText(r: NormalizedResult): string {
  let text = cache.get(r);
  if (text === undefined) {
    const parts: (string | null)[] = [
      r.title, r.tagline, r.subtitle, r.category, r.description, r.website,
      ...r.emails, ...r.phones, ...r.socials.map((s) => s.url),
      ...r.badges, ...r.facts.map((f) => f.value),
    ];
    // Valeurs texte du premier niveau de l'objet original, sans les champs HTML
    // (sinon une recherche « p » ou « ul » trouverait des balises)
    for (const [key, v] of Object.entries(r.raw)) {
      if (typeof v === "string" && !/html$/i.test(key)) parts.push(v);
    }
    text = fold(parts.filter(Boolean).join("\n")); // minuscules et sans accents
    cache.set(r, text); // calculé une seule fois par résultat
  }
  return text;
}

// Nombre décroissant, valeurs absentes en dernier
const byNumberDesc =
  (get: (r: NormalizedResult) => number | null) =>
  (a: NormalizedResult, b: NormalizedResult) => {
    const x = get(a);
    const y = get(b);
    if (x === null && y === null) return 0;
    if (x === null) return 1;
    if (y === null) return -1;
    return y - x;
  };

const byName = (a: NormalizedResult, b: NormalizedResult) => {
  if (!a.title && !b.title) return 0;
  if (!a.title) return 1;
  if (!b.title) return -1;
  return a.title.localeCompare(b.title, "fr", { sensitivity: "base" });
};

const timeOf = (r: NormalizedResult): number | null => {
  if (!r.date) return null;
  const t = Date.parse(r.date);
  return Number.isNaN(t) ? null : t;
};

export function exploreResults(
  results: NormalizedResult[],
  query: string,
  filters: Filters,
  sort: SortKey,
  scoreOf?: ScoreOf,
  isAnalyzed?: IsAnalyzed
): NormalizedResult[] {
  const q = fold(query.trim());
  const out = results.filter(
    (r) =>
      (!q || searchText(r).includes(q)) &&
      (!filters.withEmail || r.emails.length > 0) &&
      (!filters.withPhone || r.phones.length > 0) &&
      (!filters.withWebsite || r.website !== null) &&
      (!filters.withSocial || r.socials.length > 0) &&
      (!filters.goodMatch || (scoreOf?.(r) ?? -1) >= GOOD_MATCH) &&
      (!filters.analyzed || (isAnalyzed?.(r) ?? false))
  );
  if (sort === "default") return out;
  const sorted = [...out]; // on ne modifie jamais le tableau d'origine
  if (sort === "name") sorted.sort(byName);
  if (sort === "rating") sorted.sort(byNumberDesc((r) => r.rating));
  if (sort === "reviews") sorted.sort(byNumberDesc((r) => r.reviewsCount));
  if (sort === "date") sorted.sort(byNumberDesc(timeOf));
  if (sort === "match" && scoreOf) sorted.sort(byNumberDesc(scoreOf));
  return sorted;
}


// Compteurs affichés sur les filtres
export function countFilters(
  results: NormalizedResult[],
  scoreOf?: ScoreOf,
  isAnalyzed?: IsAnalyzed
): Record<keyof Filters, number> {
  return {
    withEmail: results.filter((r) => r.emails.length > 0).length,
    withPhone: results.filter((r) => r.phones.length > 0).length,
    withWebsite: results.filter((r) => r.website !== null).length,
    withSocial: results.filter((r) => r.socials.length > 0).length,
    goodMatch: scoreOf ? results.filter((r) => (scoreOf(r) ?? -1) >= GOOD_MATCH).length : 0,
        analyzed: isAnalyzed ? results.filter(isAnalyzed).length : 0,

  };
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount); // page toujours valide
  return {
    items: items.slice((current - 1) * pageSize, current * pageSize),
    page: current,
    pageCount,
  };
}