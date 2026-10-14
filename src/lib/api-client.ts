import type { RunInfo } from "@/lib/run-status";

export class ApiError extends Error {}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError("Connexion impossible : vérifie ton réseau");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error ?? "Erreur inattendue");
  return data as T;
}

export const startRun = (actorId: string, input: Record<string, unknown>, maxItems?: number) =>
  request<RunInfo>("/api/apify/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actorId, input, maxItems }), // maxItems undefined → omis par JSON.stringify
  });

export const getRun = (runId: string) => request<RunInfo>(`/api/apify/runs/${runId}`);

export const abortRun = (runId: string) =>
  request<RunInfo>(`/api/apify/runs/${runId}/abort`, { method: "POST" });

export const getDatasetItems = (datasetId: string, limit = 1000) =>
  request<{ items: unknown[]; total: number; offset: number; limit: number }>(
    `/api/apify/datasets/${datasetId}?limit=${limit}`
  );

// Teste le jeton Apify côté serveur ; ne renvoie que le nom du compte, jamais le jeton
export const getHealth = () => request<{ ok: true; username: string }>("/api/apify/health");