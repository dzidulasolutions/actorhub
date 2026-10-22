import type { Metadata } from "next";
import { SetupPage } from "@/components/learn/setup-form";

export const metadata: Metadata = { title: "Réglages du programme" };

export default function Page() {
  return <SetupPage />;
}