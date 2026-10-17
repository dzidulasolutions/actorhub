import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuthConfig, SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";

// start : lancer une collecte (coûte des crédits) → strict
// read  : statut, résultats, interruption → large, car le suivi interroge toutes les 2 à 5 s
const LIMITS = {
  start: { limit: 20, windowMs: 60 * 60_000 }, // 20 lancements par heure
  read: { limit: 600, windowMs: 10 * 60_000 }, // 600 appels par 10 minutes
  mail: { limit: 10, windowMs: 10 * 60_000 }, // 10 envois d'email par 10 minutes
} as const;

/** Renvoie une réponse d'erreur si l'appel est refusé, sinon null. */
export async function guard(req: Request, bucket: keyof typeof LIMITS): Promise<NextResponse | null> {
  const cfg = getAuthConfig();
  if (!cfg) {
    return NextResponse.json({ ok: false, error: "Accès non configuré sur le serveur" }, { status: 503 });
  }
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await verifySessionToken(token, cfg.sessionSecret))) {
    return NextResponse.json({ ok: false, error: "Session expirée : reconnecte-toi" }, { status: 401 });
  }
  const { limit, windowMs } = LIMITS[bucket];
  const result = rateLimit(`${bucket}:${clientIp(req)}`, limit, windowMs);
  return result.ok ? null : tooMany(result.retryAfterS);
}