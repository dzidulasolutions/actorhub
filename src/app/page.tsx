// src/app/page.tsx  (remplace la page de test)
import { redirect } from "next/navigation";

// Provisoire : l'étape 6 y branchera l'onboarding
export default function Home() {
  redirect("/dashboard");
}