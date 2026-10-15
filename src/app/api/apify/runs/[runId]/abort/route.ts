import { NextResponse } from "next/server";
import { apifyFetch, toRunInfo, errorResponse, type ApifyRun } from "@/lib/apify";
import { APIFY_RESOURCE_ID } from "@/lib/validations";
import { guard } from "@/lib/api-guard";

// POST /api/apify/runs/:runId/abort
export async function POST(
  req: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const denied = await guard(req, "read");
    if (denied) return denied;
    const { runId } = await params;
    if (!APIFY_RESOURCE_ID.test(runId)) {
      return NextResponse.json({ ok: false, error: "Identifiant de run invalide" }, { status: 400 });
    }
    const res = await apifyFetch<{ data: ApifyRun }>(`/actor-runs/${runId}/abort`, {
      method: "POST",
    });
    return NextResponse.json(toRunInfo(res.data));
  } catch (e) {
    return errorResponse(e);
  }
}