import type { Metadata } from "next";
import { Suspense } from "react";
import { NewSearchPage } from "@/components/searches/new-search-page";
import { NewSearchSkeleton } from "@/components/searches/new-search-skeleton";

export const metadata: Metadata = { title: "Nouvelle recherche" };

// NewSearchPage lit l'URL (?actor=…) : il doit être enveloppé par Suspense
export default function Page() {
  return (
    <Suspense fallback={<NewSearchSkeleton />}>
      <NewSearchPage />
    </Suspense>
  );
}