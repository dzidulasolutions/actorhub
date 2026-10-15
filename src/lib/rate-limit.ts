import { NextResponse } from "next/server";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5000; // garde-fou mémoire

/**
 * Fenêtre fixe : `limit` requêtes maximum par `windowMs` et par clé.
 * Limite : la mémoire est propre à chaque instance du serveur. Sur Vercel (serverless), c'est une
 * protection « au mieux » ; la vraie barrière reste le code d'accès et les plafonds de budget.
 */
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  // Ménage : on retire les fenêtres expirées, puis les plus anciennes si c'est encore trop
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    while (buckets.size > MAX_BUCKETS) buckets.delete(buckets.keys().next().value as string);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterS: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfterS: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count++;
  return { ok: true, retryAfterS: 0 };
}

/** Adresse du visiteur : 1re adresse de x-forwarded-for (renseigné par l'hébergeur). */
export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function tooMany(retryAfterS: number) {
  return NextResponse.json(
    { ok: false, error: `Trop de requêtes : réessaie dans ${retryAfterS} s` },
    { status: 429, headers: { "Retry-After": String(retryAfterS) } }
  );
}