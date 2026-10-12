import { PageHeader } from "@/components/layout/page-header";

export default async function DashboardPage() {
  // TEMPORAIRE : simule un chargement pour voir le skeleton. À supprimer.
  await new Promise((r) => setTimeout(r, 2500));

  return (
    <PageHeader
      title="Dashboard"
      description="Vue d'ensemble de ta session"
    />
  );
}