// Un service que tu proposes aux entreprises (prospection)
export interface Service {
  name: string;
  description: string;
}

// Profil de l'utilisateur : stocké uniquement dans le navigateur (localStorage)
export interface Profile {
  fullName: string;
  headline: string; // titre professionnel ou poste actuel
  email: string;
  phone: string;
  location: string;
  website: string; // lien de tes réalisations (facultatif)
  summary: string; // présentation courte
  skills: string[];
  languages: string[];
  targetRoles: string[]; // postes recherchés
  targetLocations: string[]; // lieux recherchés
  services: Service[]; // ce que tu proposes aux entreprises
  cvText: string; // texte intégral du CV
  cvFileName: string | null; // nom du fichier importé
  updatedAt: string | null; // ISO 8601 ; null tant que rien n'a été enregistré
}

// Constante unique : sa référence reste stable (nécessaire à useSyncExternalStore)
export const EMPTY_PROFILE: Profile = {
  fullName: "",
  headline: "",
  email: "",
  phone: "",
  location: "",
  website: "",
  summary: "",
  skills: [],
  languages: [],
  targetRoles: [],
  targetLocations: [],
  services: [],
  cvText: "",
  cvFileName: null,
  updatedAt: null,
};