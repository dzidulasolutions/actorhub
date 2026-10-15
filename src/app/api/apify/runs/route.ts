import { NextResponse } from "next/server";
import { apifyFetch, toRunInfo, errorResponse, type ApifyRun } from "@/lib/apify";
import { startRunSchema } from "@/lib/validations";
import { guard } from "@/lib/api-guard";


const MAX_BODY_CHARS = 100_000; // entrée d'Actor limitée à ~100 Ko

// POST /api/apify/runs   corps : { actorId, input, maxItems? }
export async function POST(req: Request) {
  try {
    const denied = await guard(req, "start");
        if (denied) return denied;
    const text = await req.text();
    if (text.length > MAX_BODY_CHARS) {
      return NextResponse.json({ ok: false, error: "Entrée trop volumineuse" }, { status: 413 });
    }

    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return NextResponse.json({ ok: false, error: "JSON invalide" }, { status: 400 });
    }

    const parsed = startRunSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Requête invalide" },
        { status: 400 }
      );
    }
    const { actorId, input, maxItems } = parsed.data;

    // Plafonds de coût : maxItems (demandé par l'utilisateur) et un budget max par run.
    // maxTotalChargeUsd ne s'applique qu'aux Actors facturés à l'usage ou au résultat.
    const qs = new URLSearchParams();
    if (maxItems) qs.set("maxItems", String(maxItems));
    qs.set("maxTotalChargeUsd", process.env.APIFY_MAX_CHARGE_USD ?? "1");

    const res = await apifyFetch<{ data: ApifyRun }>(
      `/acts/${actorId}/runs?${qs.toString()}`,
      { method: "POST", body: JSON.stringify(input) }
    );
    return NextResponse.json(toRunInfo(res.data), { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}