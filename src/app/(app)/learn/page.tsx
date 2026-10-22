import type { Metadata } from "next";
import { LearnHome } from "@/components/learn/learn-home";

export const metadata: Metadata = { title: "Apprendre" };

export default function Page() {
  return <LearnHome />;
}