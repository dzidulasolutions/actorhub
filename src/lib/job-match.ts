// Score de correspondance profil ↔ offre : 100 % local, sans IA, sans réseau.
import type { Profile } from "../types/profile";
import type { NormalizedResult } from "../types/results";
import { fold } from "./explore-results";

export type MatchLevel = "fort" | "moyen" | "faible";

export interface MatchResult {
  score: number; // 0 à 100
  level: MatchLevel;
  matchedSkills: string[]; // tes compétences retrouvées dans l'offre
  skillsTotal: number; // nombre de compétences de ton profil
  roleRatio: number | null; // part des mots d'un poste recherché présents dans le titre (null = non renseigné)
  locationMatch: boolean | null; // null = non renseigné
}

const SKILL_TARGET = 5; // 5 compétences retrouvées = note maximale sur ce critère
const WEIGHTS = { skills: 0.6, role: 0.25, location: 0.15 } as const;
const MAX_TEXT = 8000; // on ne lit que le début de l'offre (rapide, même sur de grosses collectes)

// Équivalences de compétences (en minuscules, sans accents). À compléter au fil des besoins.
const SKILL_ALIASES: string[][] = [
  ["javascript", "js"],
  ["typescript", "ts"],
  ["node.js", "nodejs", "node js"],
  ["react", "react.js", "reactjs"],
  ["next.js", "nextjs"],
  ["vue", "vue.js", "vuejs"],
  ["postgresql", "postgres"],
  ["spring boot", "springboot"],
  ["machine learning", "ml"],
  ["c#", "csharp"],
  ["amazon web services", "aws"],
  ["ci/cd", "cicd"],
];
const ALIAS_INDEX = new Map<string, string[]>();
for (const group of SKILL_ALIASES) for (const term of group) ALIAS_INDEX.set(term, group);

// Mots sans valeur pour comparer des intitulés de poste
const STOPWORDS = new Set(["de", "du", "des", "la", "le", "les", "et", "en", "au", "aux", "pour", "the", "of", "and", "an", "for", "to", "in", "hf"]);

// Équivalences français / anglais pour les intitulés
const ROLE_SYNONYMS: string[][] = [
  ["developpeur", "developer", "dev", "programmeur", "programmer"],
  ["ingenieur", "engineer"],
  ["stagiaire", "intern", "internship", "stage"],
  ["responsable", "manager"],
  ["comptable", "accountant", "accounting"],
  ["commercial", "sales"],
  ["analyste", "analyst"],
  ["donnees", "data"],
  ["redacteur", "writer"],
];

// Pluriel simple : "developers" → "developer"
const stem = (t: string) => (t.length > 3 && t.endsWith("s") ? t.slice(0, -1) : t);

const ROLE_CANON = new Map<string, string>();
for (const group of ROLE_SYNONYMS) {
  const canon = stem(group[0]);
  for (const word of group) ROLE_CANON.set(stem(word), canon);
}

function tokens(text: string): string[] {
  return fold(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map((t) => {
      const s = stem(t);
      return ROLE_CANON.get(s) ?? s;
    });
}

// Recherche d'un terme entier : « react » ne doit pas être trouvé dans « reactor ».
// Pas d'expression régulière (inutile ici, et certains vieux navigateurs refusent les lookbehind).
function containsTerm(text: string, term: string): boolean {
  // Pour un terme très court (« c », « r »), on refuse aussi « c++ » et « c# » : autres langages
  const afterBad = term.length <= 2 ? /[a-z0-9+#]/ : /[a-z0-9]/;
  let from = 0;
  for (;;) {
    const i = text.indexOf(term, from);
    if (i === -1) return false;
    const before = i === 0 ? "" : text[i - 1];
    const after = text[i + term.length] ?? "";
    // « . » avant le terme est refusé : « js » ne doit pas être trouvé dans « node.js »
    if (!/[a-z0-9.]/.test(before) && !afterBad.test(after)) return true;
    from = i + 1;
  }
}

function termsFor(skill: string): string[] {
  const f = fold(skill).trim();
  if (!f) return [];
  return [...new Set(ALIAS_INDEX.get(f) ?? [f])];
}

const REMOTE_WORDS = ["remote", "teletravail", "a distance", "work from home"];
const isRemoteWish = (loc: string) => REMOTE_WORDS.includes(loc) || loc === "distance";

export const matchLevel = (score: number): MatchLevel =>
  score >= 70 ? "fort" : score >= 40 ? "moyen" : "faible";

/**
 * Prépare le calcul pour un profil donné (une seule fois), puis renvoie une fonction à appliquer
 * à chaque résultat. Renvoie null pour une fiche qui n'est pas une offre, ou si le profil n'a ni
 * compétences, ni postes, ni lieux recherchés.
 */
export function createJobScorer(profile: Profile): (r: NormalizedResult) => MatchResult | null {
  const skills = profile.skills
    .map((label) => ({ label, terms: termsFor(label) }))
    .filter((s) => s.terms.length > 0);
  const roles = profile.targetRoles.map(tokens).filter((t) => t.length > 0);
  const locations = profile.targetLocations.map((l) => fold(l).trim()).filter(Boolean);

  if (skills.length === 0 && roles.length === 0 && locations.length === 0) return () => null;

  return (r) => {
    if (r.kind !== "job") return null;

    const text = fold([r.title, r.category, r.description].filter(Boolean).join("\n").slice(0, MAX_TEXT));
    let weighted = 0;
    let totalWeight = 0;

    const matchedSkills = skills.filter((s) => s.terms.some((t) => containsTerm(text, t))).map((s) => s.label);
    if (skills.length > 0) {
      weighted += WEIGHTS.skills * Math.min(1, matchedSkills.length / Math.min(SKILL_TARGET, skills.length));
      totalWeight += WEIGHTS.skills;
    }

    let roleRatio: number | null = null;
    if (roles.length > 0) {
      const title = new Set(tokens(r.title ?? ""));
      roleRatio = Math.max(...roles.map((role) => role.filter((t) => title.has(t)).length / role.length));
      weighted += WEIGHTS.role * roleRatio;
      totalWeight += WEIGHTS.role;
    }

    let locationMatch: boolean | null = null;
    if (locations.length > 0) {
      const place = fold(r.subtitle ?? "");
      const remoteOffer =
        r.raw.workRemoteAllowed === true || containsTerm(place, "remote") || REMOTE_WORDS.some((w) => containsTerm(text, w));
      locationMatch = locations.some((loc) => (isRemoteWish(loc) ? remoteOffer : place.includes(loc)));
      weighted += WEIGHTS.location * (locationMatch ? 1 : 0);
      totalWeight += WEIGHTS.location;
    }

    const score = Math.round((100 * weighted) / totalWeight);
    return { score, level: matchLevel(score), matchedSkills, skillsTotal: skills.length, roleRatio, locationMatch };
  };
}