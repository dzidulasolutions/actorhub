"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isOnboarded } from "@/lib/local-storage";
import { OnboardingSkeleton } from "@/components/onboarding/onboarding-skeleton";

// Porte d'entrée : localStorage n'existe que côté navigateur, donc la décision
// se prend ici, après l'affichage. Premier passage → onboarding, sinon → dashboard.
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(isOnboarded() ? "/dashboard" : "/onboarding");
  }, [router]);

  return <OnboardingSkeleton />;
}