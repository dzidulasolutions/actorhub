"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setOnboarded } from "@/lib/local-storage";
import { OnboardingShell } from "./onboarding-shell";
import { WelcomeStep, HowItWorksStep, FirstActorStep } from "./steps";

const STEPS = ["Bienvenue", "Fonctionnement", "Premier Actor"] as const;

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Marque l'onboarding comme vu puis ouvre le dashboard (aussi utilisé par "Passer")
  const finish = () => {
    setOnboarded();
    router.replace("/dashboard");
  };

  return (
    <OnboardingShell step={step} steps={STEPS} onSkip={finish}>
      {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}
      {step === 1 && (
        <HowItWorksStep onNext={() => setStep(2)} onBack={() => setStep(0)} />
      )}
      {step === 2 && <FirstActorStep onDone={finish} onBack={() => setStep(1)} />}
    </OnboardingShell>
  );
}