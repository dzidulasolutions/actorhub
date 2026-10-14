import type { Metadata } from "next";
import { ResultsPage } from "@/components/results/results-page";

export const metadata: Metadata = { title: "Résultats" };

export default function Page() {
  return <ResultsPage />;
}