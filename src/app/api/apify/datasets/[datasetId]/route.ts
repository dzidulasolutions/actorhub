import { NextResponse } from "next/server";
import { apifyFetchRaw, errorResponse } from "@/lib/apify";
import { APIFY_RESOURCE_ID } from "@/lib/validations";

// Lit un entier dans l'URL avec valeur par défaut et bornes
function intParam(value: string | null, fallback: number, min: number, max: number) {
  const n = Number(value);
  return Number.isInteger(n) ? Math.min(Math.max(n, min), max) : fallback;
}

// GET /api/apify/datasets/:datasetId?limit=100&offset=0
export async function GET(
  req: Request,
  { params }: { params: Promise<{ datasetId: string }> }
) {
  try {
    const { datasetId } = await params;
    if (!APIFY_RESOURCE_ID.test(datasetId)) {
      return NextResponse.json({ ok: false, error: "Identifiant de dataset invalide" }, { status: 400 });
    }

    const sp = new URL(req.url).searchParams;
    const limit = intParam(sp.get("limit"), 100, 1, 1000);
    const offset = intParam(sp.get("offset"), 0, 0, 1_000_000);

    // Pas de clean=true : on garde les objets ORIGINAUX tels que renvoyés par l'Actor
    const { data, headers } = await apifyFetchRaw<unknown[]>(
      `/datasets/${datasetId}/items?format=json&limit=${limit}&offset=${offset}`
    );

    return NextResponse.json({
      items: data,
      // Apify donne le total dans cet en-tête : permet de paginer côté interface
      total: Number(headers.get("x-apify-pagination-total") ?? data.length),
      offset,
      limit,
    });
  } catch (e) {
    return errorResponse(e);
  }
}