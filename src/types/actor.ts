export type ActorCategory = "social" | "maps" | "web" | "other";

export const CATEGORY_LABELS: Record<ActorCategory, string> = {
  social: "Réseaux sociaux",
  maps: "Cartographie",
  web: "Recherche web",
  other: "Autre",
};

// Configuration locale d'un Actor (stockée en localStorage, jamais le jeton Apify)
export interface ActorConfig {
  id: string; // identifiant local (uuid)
  name: string; // nom d'affichage
  apifyId: string; // forme normalisée "utilisateur~actor"
  category: ActorCategory;
  description?: string;
  enabled: boolean;
  input: Record<string, unknown>; // JSON d'entrée propre à chaque Actor
  createdAt: string; // ISO 8601
}