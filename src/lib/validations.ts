import { z } from "zod";

/**
 * Accepte : "user/actor", "user~actor", un ID brut de 17 caractères
 * ou une URL https://apify.com/user/actor.
 * Retourne la forme normalisée "user~actor", ou null si invalide.
 * Sécurité : on n'accepte QUE le domaine apify.com, aucune autre destination.
 */
export function normalizeApifyId(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (url.protocol !== "https:") return null;
      if (!["apify.com", "www.apify.com"].includes(url.hostname)) return null;
      const [user, actor] = url.pathname.split("/").filter(Boolean);
      return user && actor ? normalizeApifyId(`${user}/${actor}`) : null;
    } catch {
      return null;
    }
  }

  if (/^[A-Za-z0-9]{17}$/.test(value)) return value; // ID brut
  if (/^[A-Za-z0-9_.-]+[/~][A-Za-z0-9_.-]+$/.test(value)) {
    return value.replace("/", "~");
  }
  return null;
}

export const actorFormSchema = z.object({
  name: z.string().trim().min(2, "Au moins 2 caractères").max(60, "60 caractères maximum"),
  apifyRef: z
    .string()
    .refine(
      (v) => normalizeApifyId(v) !== null,
      "Format attendu : utilisateur/actor ou lien apify.com"
    ),
  category: z.enum(["social", "maps", "web", "other"]),
  // Nouveau : description facultative (l'onboarding ne l'envoie pas, d'où .optional())
  description: z.string().trim().max(200, "200 caractères maximum").optional(),
});

const MAX_INPUT_BYTES = 50_000; // garde-fou : on ne stocke pas des JSON géants

/**
 * Valide le JSON d'entrée d'un Actor : doit être un objet { ... }.
 * Vide = objet vide (certains Actors fonctionnent avec leurs valeurs par défaut).
 */
export function parseActorInput(
  text: string
): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  const t = text.trim();
  if (!t) return { ok: true, value: {} };
  if (new Blob([t]).size > MAX_INPUT_BYTES) {
    return { ok: false, error: "JSON trop volumineux (50 Ko maximum)" };
  }
  try {
    const parsed: unknown = JSON.parse(t);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, error: "Le JSON doit être un objet : { ... }" };
    }
    return { ok: true, value: parsed as Record<string, unknown> };
  } catch (e) {
    return { ok: false, error: `JSON invalide : ${(e as Error).message}` };
  }
}

export type ActorFormValues = z.infer<typeof actorFormSchema>;