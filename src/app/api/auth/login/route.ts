import { NextResponse } from "next/server";
import {
  createSessionToken,
  getAuthConfig,
  safeEqual,
  SESSION_COOKIE,
  SESSION_MAX_AGE_S,
} from "@/lib/auth";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";

const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status });

// POST /api/auth/login   corps : { code }
export async function POST(req: Request) {
  const cfg = getAuthConfig();
  if (!cfg) return fail("Accès non configuré sur le serveur", 503);

  // Freine les essais en série (10 tentatives par 15 minutes et par adresse)
  const limit = rateLimit(`login:${clientIp(req)}`, 10, 15 * 60_000);
  if (!limit.ok) return tooMany(limit.retryAfterS);

  const text = await req.text();
  if (text.length > 1000) return fail("Requête trop volumineuse", 413);

  let code: unknown;
  try {
    code = (JSON.parse(text) as { code?: unknown }).code;
  } catch {
    return fail("Requête invalide", 400);
  }
  if (typeof code !== "string" || !safeEqual(code, cfg.accessCode)) {
    return fail("Code incorrect", 401);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: SESSION_COOKIE,
    value: await createSessionToken(cfg.sessionSecret),
    httpOnly: true, // illisible depuis le JavaScript de la page
    secure: process.env.NODE_ENV === "production", // HTTPS uniquement en production
    sameSite: "strict", // jamais envoyé depuis un autre site (protège aussi contre le CSRF)
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
  return res;
}