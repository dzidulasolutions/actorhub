import type { Metadata } from "next";
import { ActorsPage } from "@/components/actors/actors-page";

export const metadata: Metadata = { title: "Actors" };

export default function Page() {
  return <ActorsPage />;
}