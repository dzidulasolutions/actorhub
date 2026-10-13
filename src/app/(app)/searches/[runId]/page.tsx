import type { Metadata } from "next";
import { RunPage } from "@/components/searches/run-page";

export const metadata: Metadata = { title: "Suivi de recherche" };

export default async function Page({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return <RunPage runId={runId} />;
}