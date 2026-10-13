import type { Metadata } from "next";
import { HistoryPage } from "@/components/history/history-page";

export const metadata: Metadata = { title: "Historique" };

export default function Page() {
  return <HistoryPage />;
}