"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Download, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/page-header";
import { useProfile } from "@/hooks/use-profile";
import { downloadJson } from "@/lib/export-json";
import { MAX_CV_CHARS, profileReadiness, profileSchema } from "@/lib/profile-schema";
import { saveProfile } from "@/lib/profile-store";
import type { Profile } from "@/types/profile";
import { ProfileSkeleton } from "./profile-skeleton";
import { TagInput } from "./tag-input";
import { FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CvImportError, extractCvText } from "@/lib/cv-text";
import { CvImport } from "./cv-import";
import { ServicesEditor } from "./services-editor";

export function ProfilePage() {
  const { profile, ready } = useProfile();
  if (!ready) return <ProfileSkeleton />;
  // L'éditeur garde son propre brouillon : il n'est créé qu'une fois le profil lu
  return <ProfileEditor initial={profile} />;
}

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

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function ProfileEditor({ initial }: { initial: Profile }) {
  const [draft, setDraft] = useState<Profile>(initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial)); // dernière version enregistrée
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importNote, setImportNote] = useState<string | null>(null);

  const dirty = JSON.stringify(draft) !== baseline;
  const { checks, ready: profileReady } = profileReadiness(draft);

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  // Prévient avant de fermer ou de recharger la page avec des modifications non enregistrées
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Le message « Enregistré » disparaît tout seul
  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 3000);
    return () => clearTimeout(t);
  }, [justSaved]);

  function handleSave() {
    const result = profileSchema.safeParse(draft);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    const saved: Profile = { ...result.data, updatedAt: new Date().toISOString() };
    if (!saveProfile(saved)) {
      setSaveError("Enregistrement impossible : le stockage du navigateur est plein ou désactivé.");
      return;
    }
    setDraft(saved);
    setBaseline(JSON.stringify(saved));
    setErrors({});
    setSaveError(null);
    setJustSaved(true);
  }

  function handleDownload() {
    const date = new Date().toISOString().slice(0, 10);
    downloadJson(draft, `actorhub-profil-${date}.json`);
  }

  async function handleImport(file: File) {
    setImporting(true);
    setImportError(null);
    setImportNote(null);
    try {
      const { text, truncated } = await extractCvText(file);
      // Le brouillon est remplacé ; le profil enregistré ne change qu'au clic sur « Enregistrer »
      setDraft((d) => ({ ...d, cvText: text, cvFileName: file.name }));
      setImportNote(
        truncated
          ? "Le CV dépasse 50 000 caractères : le texte a été coupé."
          : "Texte extrait. Relis-le : une mise en page sur deux colonnes peut en mélanger l'ordre."
      );
    } catch (e) {
      setImportError(e instanceof CvImportError ? e.message : "Import impossible");
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Mon profil"
        description="Tes informations et ton CV, stockés uniquement dans ce navigateur"
        actions={
          <>
            {justSaved && (
              <span role="status" className="inline-flex items-center gap-1.5 text-sm text-success">
                <CheckCircle2 className="size-4" /> Enregistré
              </span>
            )}
            <Button type="button" onClick={handleSave} disabled={!dirty} className="h-9 gap-2">
              <Save className="size-4" /> Enregistrer
            </Button>
          </>
        }
      />

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          {saveError && (
            <p role="alert" className="border-l-2 border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {saveError}
            </p>
          )}

          <Section title="Identité">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="p-name" label="Nom complet" error={errors.fullName}>
                <Input id="p-name" value={draft.fullName} onChange={(e) => set("fullName", e.target.value)} className="h-10" />
              </Field>
              <Field id="p-headline" label="Titre professionnel" error={errors.headline}>
                <Input id="p-headline" value={draft.headline} onChange={(e) => set("headline", e.target.value)} placeholder="Ex. Développeur full-stack" className="h-10" />
              </Field>
              <Field id="p-email" label="Email" error={errors.email}>
                <Input id="p-email" type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} className="h-10" />
              </Field>
              <Field id="p-phone" label="Téléphone" error={errors.phone}>
                <Input id="p-phone" type="tel" value={draft.phone} onChange={(e) => set("phone", e.target.value)} className="h-10" />
              </Field>
              <div className="sm:col-span-2">
                <Field id="p-location" label="Ville et pays" error={errors.location}>
                  <Input id="p-location" value={draft.location} onChange={(e) => set("location", e.target.value)} placeholder="Ex. Lomé, Togo" className="h-10" />
                </Field>
              </div>
            </div>
            <Field id="p-summary" label="Présentation courte" error={errors.summary}>
              <Textarea id="p-summary" value={draft.summary} onChange={(e) => set("summary", e.target.value)} rows={4} maxLength={2000} />
            </Field>
          </Section>

          <Section title="Compétences et recherche" description="Ces listes servent à trier les offres selon ton profil.">
            <TagInput id="p-skills" label="Compétences" value={draft.skills} onChange={(v) => set("skills", v)} placeholder="Ex. React, Node.js, Flutter" max={60} />
            <TagInput id="p-langs" label="Langues" value={draft.languages} onChange={(v) => set("languages", v)} placeholder="Ex. Français, Anglais" max={15} />
            <TagInput id="p-roles" label="Postes recherchés" value={draft.targetRoles} onChange={(v) => set("targetRoles", v)} placeholder="Ex. Développeur web, Ingénieur logiciel" max={20} />
            <TagInput id="p-places" label="Lieux recherchés" value={draft.targetLocations} onChange={(v) => set("targetLocations", v)} placeholder="Ex. Lomé, Remote, Paris" max={20} />
          </Section>

          <Section
            title="Mes services (prospection)"
            description="Ce que tu proposes aux entreprises. Ces textes servent à préparer des propositions personnalisées."
          >
            <ServicesEditor value={draft.services} onChange={(v) => set("services", v)} />
            {errors.services && <p className="text-sm text-destructive">{errors.services}</p>}
            <Field id="p-website" label="Lien de mes réalisations (facultatif)" error={errors.website}>
              <Input
                id="p-website"
                type="url"
                value={draft.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://…"
                className="h-10"
              />
            </Field>
          </Section>

          <Section
            title="Mon CV"
            description="Importe ton CV (PDF, Word .docx ou texte) ou colle son contenu. Le fichier est lu dans ton navigateur : il n'est ni envoyé ni conservé, seul le texte l'est."
          >
            <CvImport busy={importing} onFile={handleImport} />

            {importError && (
              <p role="alert" className="border-l-2 border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {importError}
              </p>
            )}
            {importNote && !importError && (
              <p role="status" className="border-l-2 border-primary bg-accent px-4 py-3 text-sm">{importNote}</p>
            )}
            {draft.cvFileName && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="size-4 shrink-0" />
                <span className="min-w-0 truncate">Importé depuis {draft.cvFileName}</span>
              </p>
            )}

            <div className="space-y-2">
              {importing ? (
                <Skeleton className="h-72 w-full" aria-hidden="true" />
              ) : (
                <Textarea
                  id="p-cv"
                  aria-label="Texte du CV"
                  value={draft.cvText}
                  onChange={(e) => set("cvText", e.target.value)}
                  rows={14}
                  maxLength={MAX_CV_CHARS}
                  placeholder="Ou colle ici le texte de ton CV…"
                  className="font-mono text-sm"
                />
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {draft.cvText.length.toLocaleString("fr-FR")} / {MAX_CV_CHARS.toLocaleString("fr-FR")} caractères
                </span>
                {draft.cvText && (
                  <button
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, cvText: "", cvFileName: null }))}
                    className="hover:text-destructive"
                  >
                    Effacer le texte du CV
                  </button>
                )}
              </div>
              {errors.cvText && <p className="text-sm text-destructive">{errors.cvText}</p>}
            </div>
          </Section>
        </div>

        {/* ===== Colonne latérale ===== */}
        <aside className="h-fit space-y-4 lg:sticky lg:top-6">
          <section className="space-y-3 border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Profil prêt pour l&apos;analyse</h2>
            <ul className="space-y-2 text-sm">
              {checks.map((c) => (
                <li key={c.label} className="flex items-start gap-2">
                  {c.ok ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  ) : (
                    <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className={c.ok ? "" : "text-muted-foreground"}>{c.label}</span>
                </li>
              ))}
            </ul>
            <p className={profileReady ? "text-sm font-medium text-success" : "text-xs text-muted-foreground"}>
              {profileReady ? "Ton profil est complet." : "Complète ces points pour de meilleurs résultats."}
            </p>
          </section>

          <p className="border-l-2 border-primary bg-accent px-4 py-3 text-xs">
            Ces informations restent dans ce navigateur : elles disparaissent si tu vides les données du site.
            Télécharge une copie pour la garder en sécurité.
          </p>

          <Button type="button" variant="outline" onClick={handleDownload} className="h-9 w-full gap-2">
            <Download className="size-4" /> Télécharger mon profil (JSON)
          </Button>
        </aside>
      </div>
    </>
  );
}