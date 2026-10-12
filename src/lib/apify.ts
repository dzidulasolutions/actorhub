import "server-only"; // erreur de build si importé côté navigateur
import { NextResponse } from "next/server";
import { mapApifyStatus, type RunInfo } from "@/lib/run-status";

const APIFY_BASE = "https://api.apify.com/v2"; // seule destination autorisée
const TIMEOUT_MS = 20_000;
const MAX_RESPONSE_BYTES = 20 * 1024 * 1024; // 20 Mo : au-delà, on refuse

// Erreur "propre" : le message est sûr à renvoyer au navigateur (jamais le jeton)
export class ApifyError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

/** Appel Apify qui renvoie le contenu ET les en-têtes de la réponse. */
export async function apifyFetchRaw<T>(
  path: string, // construit par NOTRE code, jamais par le navigateur
  init: RequestInit = {}
): Promise<{ data: T; headers: Headers }> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new ApifyError("Jeton Apify non configuré sur le serveur", 500);

  let res: Response;
  try {
    res = await fetch(`${APIFY_BASE}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${token}`, // en en-tête : jamais dans l'URL
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS), // ne bloque jamais indéfiniment
      cache: "no-store",
    });
  } catch {
    throw new ApifyError("Apify est injoignable ou trop lent à répondre", 504);
  }

  if (!res.ok) {
    // Messages génériques : on ne recopie pas le corps de l'erreur Apify
    const messages: Record<number, string> = {
      400: "Requête refusée par Apify : vérifie l'entrée de l'Actor",
      401: "Jeton Apify invalide ou expiré",
      402: "Crédits Apify insuffisants",
      403: "Ce jeton n'a pas la permission pour cette action",
      404: "Ressource Apify introuvable (Actor, run ou dataset)",
      429: "Trop de requêtes vers Apify, réessaie dans un instant",
    };
    throw new ApifyError(messages[res.status] ?? "Erreur Apify", res.status);
  }

  // Garde-fou : réponse annoncée trop volumineuse
  if (Number(res.headers.get("content-length") ?? 0) > MAX_RESPONSE_BYTES) {
    throw new ApifyError("Réponse trop volumineuse : réduis la limite de résultats", 413);
  }

  return { data: (await res.json()) as T, headers: res.headers };
}

/** Version simple : uniquement le contenu. */
export async function apifyFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  return (await apifyFetchRaw<T>(path, init)).data;
}

// ---------- Run Apify → RunInfo (ce qu'on envoie au navigateur) ----------
export interface ApifyRun {
  id: string;
  status: string;
  defaultDatasetId?: string;
  startedAt?: string;
  finishedAt?: string;
  usageTotalUsd?: number;
}

export function toRunInfo(run: ApifyRun): RunInfo {
  return {
    id: run.id,
    status: mapApifyStatus(run.status),
    rawStatus: run.status,
    datasetId: run.defaultDatasetId ?? null,
    startedAt: run.startedAt ?? null,
    finishedAt: run.finishedAt ?? null,
    usageUsd: run.usageTotalUsd ?? null,
  };
}

// Réponse d'erreur JSON uniforme pour toutes les routes
export function errorResponse(e: unknown, fallbackStatus = 500) {
  const status = e instanceof ApifyError ? e.status : fallbackStatus;
  const message = e instanceof ApifyError ? e.message : "Erreur serveur";
  return NextResponse.json({ ok: false, error: message }, { status });
}