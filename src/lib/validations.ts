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
  name: z
    .string()
    .trim()
    .min(2, "Au moins 2 caractères")
    .max(60, "60 caractères maximum"),
  apifyRef: z
    .string()
    .refine(
      (v) => normalizeApifyId(v) !== null,
      "Format attendu : utilisateur/actor ou lien apify.com"
    ),
  category: z.enum(["social", "maps", "web", "other"]),
});

export type ActorFormValues = z.infer<typeof actorFormSchema>;