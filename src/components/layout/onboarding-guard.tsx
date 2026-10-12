"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isOnboarded } from "@/lib/local-storage";

// Redirige vers /onboarding si l'utilisateur ne l'a jamais terminé.
// Rien n'est affiché pendant la vérification (une frame) pour éviter un flash de contenu.
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (isOnboarded()) setAllowed(true);
    else router.replace("/onboarding");
  }, [router]);

  return allowed ? <>{children}</> : null;
}