import { NextResponse } from "next/server";
import { apifyFetch, toRunInfo, errorResponse, type ApifyRun } from "@/lib/apify";
import { APIFY_RESOURCE_ID } from "@/lib/validations";

// GET /api/apify/runs/:runId
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ runId: string }> } // Next 15+ : params est une Promise
) {
  try {
    const { runId } = await params;
    if (!APIFY_RESOURCE_ID.test(runId)) {
      return NextResponse.json({ ok: false, error: "Identifiant de run invalide" }, { status: 400 });
    }
    const res = await apifyFetch<{ data: ApifyRun }>(`/actor-runs/${runId}`);
    return NextResponse.json(toRunInfo(res.data));
  } catch (e) {
    return errorResponse(e);
  }
}