// src/components/layout/onboarding-guard.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isOnboarded } from "@/lib/local-storage";

// Redirige vers /onboarding si l'utilisateur ne l'a jamais terminé.
// IMPORTANT : on rend TOUJOURS {children}. Renvoyer null pendant le rendu serveur
// retire la page de l'arbre et fait échouer la validation "instant navigation" de Next 16.3+.
// La vérification (localStorage = navigateur uniquement) se fait donc après l'affichage.
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isOnboarded()) router.replace("/onboarding");
  }, [router]);

  return <>{children}</>;
}