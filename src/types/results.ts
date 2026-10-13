
export type SocialNetwork =
  | "linkedin"
  | "facebook"
  | "instagram"
  | "twitter"
  | "youtube"
  | "tiktok";

export interface SocialLink {
  network: SocialNetwork;
  url: string;
}

// Fiche standard : tous les champs sont optionnels (null/vide si l'Actor ne les fournit pas).
// L'objet ORIGINAL d'Apify reste intact dans `raw`.
export interface NormalizedResult {
  index: number; // position dans la collecte : identifiant et clé de sélection
  raw: Record<string, unknown>;
  title: string | null;
  subtitle: string | null; // adresse ou lieu
  category: string | null;
  rating: number | null;
  reviewsCount: number | null;
  description: string | null;
  url: string | null; // page d'origine sur la plateforme (ex. fiche Google Maps)
  website: string | null; // site de l'entreprise
  emails: string[];
  phones: string[];
  socials: SocialLink[];
  date: string | null;
  image: string | null; // photo https (couverture de la carte)
  websiteIsDirectory: boolean; // le "site" est un annuaire ou un réseau social, pas le site de l'entreprise
}