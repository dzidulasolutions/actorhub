import { z } from "zod";
import { EMPTY_PROFILE, type Profile } from "../types/profile";

export const MAX_CV_CHARS = 50_000;
export const MAX_TAG_CHARS = 60;
export const MAX_SERVICES = 10;

const isHttpUrl = (v: string) => {
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:"; // jamais javascript: ou data:
  } catch {
    return false;
  }
};

export const serviceSchema = z.object({
  name: z.string().trim().min(1, "Chaque service a besoin d'un nom").max(80, "Nom de service : 80 caractères maximum"),
  description: z.string().trim().max(300, "Description de service : 300 caractères maximum"),
});

const tagList = z.array(z.string().trim().min(1).max(MAX_TAG_CHARS)).max(60);

export const profileSchema = z.object({
  fullName: z.string().trim().max(100, "100 caractères maximum"),
  headline: z.string().trim().max(150, "150 caractères maximum"),
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Adresse email invalide"),
  phone: z.string().trim().max(40, "40 caractères maximum"),
  location: z.string().trim().max(100, "100 caractères maximum"),
  website: z
    .string()
    .trim()
    .max(200, "200 caractères maximum")
    .refine((v) => v === "" || isHttpUrl(v), "Lien invalide : il doit commencer par https://"),
  summary: z.string().trim().max(2000, "2 000 caractères maximum"),
  skills: tagList,
  languages: tagList,
  targetRoles: tagList,
  targetLocations: tagList,
  services: z.array(serviceSchema).max(MAX_SERVICES, `${MAX_SERVICES} services maximum`),
  cvText: z.string().max(MAX_CV_CHARS, "CV trop long (50 000 caractères maximum)"),
  cvFileName: z.string().max(200).nullable(),
  updatedAt: z.string().nullable(),
});

/**
 * Relit un profil depuis le stockage. Tolérant : champs manquants complétés par les valeurs
 * par défaut (utile quand on ajoute un champ plus tard), données corrompues → profil vide.
 */
export function readProfile(raw: string | null): Profile {
  if (!raw) return EMPTY_PROFILE;
  try {
    const parsed = profileSchema.safeParse({ ...EMPTY_PROFILE, ...JSON.parse(raw) });
    return parsed.success ? parsed.data : EMPTY_PROFILE;
  } catch {
    return EMPTY_PROFILE;
  }
}

/**
 * Ajoute des étiquettes saisies ou collées (séparées par virgule, point-virgule ou retour à la ligne).
 * Sans doublons (casse ignorée), 60 caractères maximum chacune, `max` étiquettes au total.
 */
export function mergeTags(existing: string[], input: string, max = 40): string[] {
  const out = [...existing];
  const seen = new Set(out.map((t) => t.toLowerCase()));
  for (const piece of input.split(/[,;\n]/)) {
    const tag = piece.trim().slice(0, MAX_TAG_CHARS);
    if (!tag || seen.has(tag.toLowerCase())) continue;
    if (out.length >= max) break;
    seen.add(tag.toLowerCase());
    out.push(tag);
  }
  return out;
}

/** Ce qu'il faut pour que le score et l'analyse donnent un résultat utile. */
export function profileReadiness(p: Profile) {
  const checks = [
    { label: "Nom renseigné", ok: p.fullName.trim().length > 0 },
    { label: "Au moins 3 compétences", ok: p.skills.length >= 3 },
    { label: "Au moins un poste recherché", ok: p.targetRoles.length >= 1 },
    { label: "Texte du CV (300 caractères minimum)", ok: p.cvText.trim().length >= 300 },
  ];
  return { checks, ready: checks.every((c) => c.ok) };
}



/** Ce qu'il faut pour préparer une proposition de services à une entreprise. */
export function servicesReadiness(p: Profile) {
  const checks = [
    { label: "Nom renseigné", ok: p.fullName.trim().length > 0 },
    { label: "Au moins un service décrit", ok: p.services.some((s) => s.name.trim() !== "" && s.description.trim() !== "") },
    { label: "Un moyen de te contacter (email ou téléphone)", ok: p.email.trim() !== "" || p.phone.trim() !== "" },
  ];
  return { checks, ready: checks.every((c) => c.ok) };
}