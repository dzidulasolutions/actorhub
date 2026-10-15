import { NextResponse } from "next/server";
import { apifyFetch, ApifyError } from "@/lib/apify";
import { guard } from "@/lib/api-guard";

// Vérifie que le jeton fonctionne. Ne renvoie QUE le nom d'utilisateur.
export async function GET(req: Request) {
  try {
    const denied = await guard(req, "read");
    if (denied) return denied;
    const me = await apifyFetch<{ data: { username: string } }>("/users/me");
    return NextResponse.json({ ok: true, username: me.data.username });
  } catch (e) {
    const status = e instanceof ApifyError ? e.status : 500;
    const message = e instanceof ApifyError ? e.message : "Erreur serveur";
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}