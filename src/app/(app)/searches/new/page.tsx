import type { Metadata } from "next";
import { NewSearchPage } from "@/components/searches/new-search-page";

export const metadata: Metadata = { title: "Nouvelle recherche" };

export default function Page() {
  return <NewSearchPage />;
}