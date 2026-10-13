// Vue "affichage" d'un résultat. L'objet ORIGINAL d'Apify reste intact dans `raw`.
export interface NormalizedResult {
  index: number; // position dans la collecte : sert d'identifiant et de clé de sélection
  raw: Record<string, unknown>;
  title: string | null;
  subtitle: string | null; // adresse ou lieu
  description: string | null;
  url: string | null; // toujours http(s)
  emails: string[];
  phones: string[];
  date: string | null;
}