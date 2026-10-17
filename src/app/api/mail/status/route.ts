import { NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { getMailConfig } from "@/lib/mail";

// GET /api/mail/status : l'envoi est-il configuré ? (ne renvoie jamais le mot de passe)
export async function GET(req: Request) {
  const denied = await guard(req, "read");
  if (denied) return denied;
  const cfg = getMailConfig();
  return NextResponse.json({ ok: true, configured: cfg !== null, from: cfg?.user ?? null });
}