"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Download, Loader2, Plug, XCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { useActors } from "@/hooks/use-actors";
import { useSavedSearches } from "@/hooks/use-saved-searches";
import { downloadJson } from "@/lib/export-json";
import { clearOnboarded, saveActors } from "@/lib/local-storage";
import { clearSaved } from "@/lib/saved-searches-store";
import { SettingsSkeleton } from "./settings-skeleton";
import { useProfile } from "@/hooks/use-profile";
import { getHealth, getMailStatus, sendMail } from "@/lib/api-client";
import { useJobNotes } from "@/hooks/use-job-note";
import { clearNotes } from "@/lib/job-notes-store";
import { clearSentLog, useSentLog } from "@/hooks/use-sent-log";


type Confirm = "actors" | "saved" | "profile" | "all";

const CONFIRM_TEXT: Record<Confirm, { title: string; text: string; action: string }> = {
  actors: {
    title: "Supprimer tous tes Actors ?",
    text: "Leur configuration (nom, identifiant, paramètres) sera effacée de ce navigateur. Les Actors eux-mêmes restent intacts sur Apify.",
    action: "Supprimer les Actors",
  },
  saved: {
    title: "Supprimer toutes les sauvegardes ?",
    text: "Les résultats sauvegardés dans ce navigateur seront effacés. Les fichiers JSON déjà téléchargés ne sont pas touchés.",
    action: "Supprimer les sauvegardes",
  },
  all: {
    title: "Tout réinitialiser ?",
    text: "Tes Actors, tes sauvegardes et l'état de l'introduction seront effacés de ce navigateur. L'application repartira de zéro.",
    action: "Tout réinitialiser",
  },
  profile: {
    title: "Supprimer ton profil ?",
    text: "Tes informations et le texte de ton CV seront effacés de ce navigateur. Les fichiers déjà téléchargés ne sont pas touchés.",
    action: "Supprimer mon profil",
  },
};

type Connection =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "ok"; text: string }
  | { state: "error"; text: string };

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border border-border bg-card p-4 sm:p-5">
      <div className="space-y-1">
        <h2 className="font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function SettingsPage() {
  const router = useRouter();
  const sentLog = useSentLog();
  const { actors, ready: actorsReady } = useActors();
  const { saved, ready: savedReady } = useSavedSearches();
  const { profile, ready: profileReady } = useProfile();

  const jobNotes = useJobNotes();
  const notesCount = Object.keys(jobNotes).length;

  const [conn, setConn] = useState<Connection>({ state: "idle" });
  // `confirm` garde le type de suppression ; `confirmOpen` pilote l'affichage (la modale se ferme toujours elle-même)
  const [confirm, setConfirm] = useState<Confirm>("actors");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const [mailInfo, setMailInfo] = useState<{ configured: boolean; from: string | null } | null>(null);
  const [mailBusy, setMailBusy] = useState<"check" | "test" | null>(null);
  const [mailMsg, setMailMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  if (!actorsReady || !savedReady || !profileReady) return <SettingsSkeleton />;

  const savedCount = saved?.length ?? 0;
  const savedResults = (saved ?? []).reduce((sum, m) => sum + m.count, 0);

  // Action explicite : le test ne part jamais tout seul
  async function testConnection() {
    setConn({ state: "checking" });
    try {
      const r = await getHealth();
      setConn({ state: "ok", text: `Connecté au compte Apify « ${r.username} »` });
    } catch (e) {
      setConn({ state: "error", text: e instanceof Error ? e.message : "Connexion impossible" });
    }
  }

  function downloadActors() {
    const date = new Date().toISOString().slice(0, 10);
    downloadJson({ exportedAt: new Date().toISOString(), count: actors.length, actors }, `actorhub-actors-${date}.json`);
  }

  function ask(kind: Confirm) {
    setConfirm(kind);
    setConfirmOpen(true);
  }

  async function runConfirmed() {
    setConfirmOpen(false); // ferme la modale tout de suite
    setMessage(null);
    try {
      if (confirm === "actors" || confirm === "all") saveActors([]);
      if (confirm === "saved" || confirm === "all") await clearSaved();
      if (confirm === "all") {
        clearOnboarded();
        if (confirm === "all") clearNotes();
        if (confirm === "all") clearSentLog();
        router.replace("/onboarding");
        return;
      }
      setMessage({ kind: "ok", text: confirm === "actors" ? "Actors supprimés." : "Sauvegardes supprimées." });
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof Error ? e.message : "Suppression impossible" });
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.assign("/login"); // rechargement complet : vide aussi la mémoire de la session
    }
  }

  async function checkMail() {
    setMailBusy("check");
    setMailMsg(null);
    try {
      setMailInfo(await getMailStatus());
    } catch (e) {
      setMailMsg({ kind: "error", text: e instanceof Error ? e.message : "Vérification impossible" });
    } finally {
      setMailBusy(null);
    }
  }

  async function sendTestMail() {
    if (!mailInfo?.from) return;
    setMailBusy("test");
    setMailMsg(null);
    try {
      await sendMail({
        to: mailInfo.from, // toujours à toi-même
        subject: "ActorHub : email de test",
        text: "Si tu lis ce message, l'envoi d'emails depuis ActorHub fonctionne.",
      });
      setMailMsg({ kind: "ok", text: `Email de test envoyé à ${mailInfo.from}. Regarde ta boîte de réception (et les spams).` });
    } catch (e) {
      setMailMsg({ kind: "error", text: e instanceof Error ? e.message : "Envoi impossible" });
    } finally {
      setMailBusy(null);
    }
  }


  return (
    <>
      <PageHeader title="Paramètres" description="Connexion Apify et données de ce navigateur" />

      <div className="max-w-3xl space-y-6 p-5 sm:p-6">
        {message && (
          <p
            role={message.kind === "error" ? "alert" : "status"}
            className={
              message.kind === "error"
                ? "border-l-2 border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
                : "border-l-2 border-success bg-success/10 px-4 py-3 text-sm text-success"
            }
          >
            {message.text}
          </p>
        )}

        {/* ===== Connexion Apify ===== */}
        <Section
          title="Connexion Apify"
          description="Le jeton est stocké sur le serveur (variable APIFY_API_TOKEN). Il n'est jamais envoyé au navigateur ni affiché ici."
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={testConnection} disabled={conn.state === "checking"} className="h-9 gap-2">
              {conn.state === "checking" ? <Loader2 className="size-4 animate-spin" /> : <Plug className="size-4" />}
              {conn.state === "checking" ? "Test en cours…" : "Tester la connexion"}
            </Button>
            {conn.state === "ok" && (
              <span role="status" className="inline-flex items-center gap-2 text-sm text-success">
                <CheckCircle2 className="size-4" /> {conn.text}
              </span>
            )}
            {conn.state === "error" && (
              <span role="alert" className="inline-flex items-center gap-2 text-sm text-destructive">
                <XCircle className="size-4" /> {conn.text}
              </span>
            )}
          </div>
        </Section>

        <Section
          title="Envoi d'emails"
          description="Permet d'envoyer tes candidatures depuis l'app avec ton propre Gmail. Les identifiants restent sur le serveur et ne sont jamais affichés."
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={checkMail} disabled={mailBusy !== null} className="h-9 gap-2">
              {mailBusy === "check" ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
              {mailBusy === "check" ? "Vérification…" : "Vérifier la configuration"}
            </Button>
            {mailInfo?.configured && (
              <Button type="button" onClick={sendTestMail} disabled={mailBusy !== null} className="h-9 gap-2">
                {mailBusy === "test" ? <Loader2 className="size-4 animate-spin" /> : null}
                {mailBusy === "test" ? "Envoi…" : "Envoyer un email de test à moi-même"}
              </Button>
            )}
          </div>

          {mailInfo?.configured && (
            <p role="status" className="inline-flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="size-4" /> Configuré : envois depuis {mailInfo.from}
            </p>
          )}
          {mailInfo && !mailInfo.configured && (
            <p className="border-l-2 border-highlight bg-highlight/10 px-4 py-3 text-sm">
              Non configuré sur ce serveur. Ajoute <code className="font-mono">GMAIL_USER</code> et{" "}
              <code className="font-mono">GMAIL_APP_PASSWORD</code> dans <code className="font-mono">.env.local</code>, puis
              redémarre. Sur l&apos;hébergement gratuit de Render, l&apos;envoi est impossible (ports d&apos;envoi bloqués).
            </p>
          )}
          {mailMsg && (
            <p
              role={mailMsg.kind === "error" ? "alert" : "status"}
              className={
                mailMsg.kind === "error"
                  ? "border-l-2 border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
                  : "border-l-2 border-success bg-success/10 px-4 py-3 text-sm text-success"
              }
            >
              {mailMsg.text}
            </p>
          )}
        </Section>

        {/* ===== Données locales ===== */}
        <Section title="Données de ce navigateur">
          <p className="flex gap-2 border-l-2 border-highlight bg-highlight/10 px-4 py-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              Tes Actors et tes sauvegardes sont stockés uniquement dans ce navigateur. Ils seront perdus si tu
              vides les données du site ou si tu changes de navigateur. Pense à télécharger des fichiers JSON.
            </span>
          </p>

          <dl className="divide-y divide-border text-sm">
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-muted-foreground">Actors configurés</dt>
              <dd className="font-medium">{actors.length}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-muted-foreground">Recherches sauvegardées</dt>
              <dd className="font-medium">
                {savedCount}
                {savedCount > 0 && <span className="font-normal text-muted-foreground"> · {savedResults} résultat{savedResults > 1 ? "s" : ""}</span>}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-muted-foreground">Profil et CV</dt>
              <dd className="font-medium">{profile.updatedAt ? "Renseigné" : "Vide"}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-muted-foreground">Analyses d&apos; offres</dt>
              <dd className="font-medium">{notesCount}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-muted-foreground">Candidatures envoyées</dt>
              <dd className="font-medium">{sentLog.length}</dd>
            </div>
          </dl>

          <Button type="button" variant="outline" onClick={downloadActors} disabled={actors.length === 0} className="h-9 gap-2">
            <Download className="size-4" /> Télécharger mes Actors (JSON)
          </Button>
        </Section>

        <Section title="Session" description="Tu restes connecté 7 jours sur cet appareil.">
          <Button type="button" variant="outline" onClick={logout} className="h-9">
            Se déconnecter
          </Button>
        </Section>

        {/* ===== Suppression ===== */}
        <Section title="Suppression" description="Ces actions sont définitives et demandent une confirmation.">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => ask("actors")} disabled={actors.length === 0} className="h-9">
              Supprimer mes Actors
            </Button>
            <Button type="button" variant="outline" onClick={() => ask("saved")} disabled={savedCount === 0} className="h-9">
              Supprimer les sauvegardes
            </Button>
            <Button type="button" variant="outline" onClick={() => ask("profile")} disabled={!profile.updatedAt} className="h-9">
              Supprimer mon profil
            </Button>
            <Button type="button" onClick={() => ask("all")} className="h-9 bg-destructive text-white hover:bg-destructive/90">
              Tout réinitialiser
            </Button>
          </div>
        </Section>


      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{CONFIRM_TEXT[confirm].title}</AlertDialogTitle>
            <AlertDialogDescription>{CONFIRM_TEXT[confirm].text}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={runConfirmed} className="bg-destructive text-white hover:bg-destructive/90">
              {CONFIRM_TEXT[confirm].action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}