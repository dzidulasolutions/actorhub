// src/types/results.ts

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

// Type de fiche détecté automatiquement (sert à adapter l'affichage, jamais à modifier les données)
export type ResultKind = "place" | "job" | "profile" | "video" | "other";

// Petite statistique affichée sur la carte (ex. « Vues : 574 k »)
export interface ResultFact {
  label: string;
  value: string;
}

// Fiche standard : tous les champs sont optionnels (null/vide si l'Actor ne les fournit pas).
// L'objet ORIGINAL d'Apify reste intact dans `raw`.
export interface NormalizedResult {
  index: number; // position dans la collecte : identifiant et clé de sélection
  raw: Record<string, unknown>;
  kind: ResultKind;
  title: string | null;
  tagline: string | null; // 2e ligne : entreprise (offre), titre (profil), auteur (vidéo)
  subtitle: string | null; // adresse ou lieu
  category: string | null;
  rating: number | null;
  reviewsCount: number | null;
  description: string | null;
  url: string | null; // page d'origine sur la plateforme
  website: string | null; // site de l'entreprise
  websiteIsDirectory: boolean; // le « site » est un annuaire ou un réseau social
  image: string | null; // image https (couverture de la carte)
  emails: string[];
  phones: string[];
  socials: SocialLink[];
  facts: ResultFact[]; // statistiques propres au type (salaire, vues, relations…)
  badges: string[]; // étiquettes courtes (Vérifié, Recrute, Sponsorisée…)
  date: string | null;
}