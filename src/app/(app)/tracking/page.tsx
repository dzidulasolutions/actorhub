import type { Metadata } from "next";
import { TrackingPage } from "@/components/tracking/tracking-page";

export const metadata: Metadata = { title: "Suivi" };

export default function Page() {
  return <TrackingPage />;
}