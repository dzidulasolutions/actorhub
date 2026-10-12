import "server-only"; // erreur de build si importé côté navigateur

const APIFY_BASE = "https://api.apify.com/v2"; // seule destination autorisée : on n'accepte jamais d'URL venant du navigateur
const TIMEOUT_MS = 20_000;

// Erreur "propre" : le message est sûr à renvoyer au navigateur (jamais le jeton)
export class ApifyError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

/**
 * Appelle l'API Apify avec le jeton serveur.
 * @param path chemin construit par NOTRE code, ex. "/users/me"
 */
export async function apifyFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new ApifyError("Jeton Apify non configuré sur le serveur", 500);
  }

  let res: Response;
  try {
    res = await fetch(`${APIFY_BASE}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${token}`, // en en-tête : le jeton ne finit pas dans les URLs ni les logs
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS), // ne bloque jamais indéfiniment
      cache: "no-store", // résultats toujours frais
    });
  } catch {
    // réseau coupé ou délai dépassé
    throw new ApifyError("Apify est injoignable ou trop lent à répondre", 504);
  }

  if (!res.ok) {
    // Messages génériques par code : on ne recopie pas le corps de l'erreur Apify
    const messages: Record<number, string> = {
      401: "Jeton Apify invalide ou expiré",
      402: "Crédits Apify insuffisants",
      403: "Ce jeton n'a pas la permission pour cette action",
      404: "Ressource Apify introuvable",
      429: "Trop de requêtes vers Apify, réessaie dans un instant",
    };
    throw new ApifyError(messages[res.status] ?? "Erreur Apify", res.status);
  }

  return (await res.json()) as T;
}