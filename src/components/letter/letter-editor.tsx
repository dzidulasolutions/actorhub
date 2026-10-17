"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Copy, Download, ExternalLink, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/page-header";
import {
  buildLetterHeader, defaultSubject, detectOfferLanguage, emailText, generateLetterBody,
  gmailLink, isValidEmail, mailtoLink, MAX_LINK_CHARS,
  type Language, type LetterJob, type LetterOptions, type Tone,
} from "@/lib/cover-letter";
import { downloadFile, slugify } from "@/lib/export-json";
import { createJobScorer } from "@/lib/job-match";
import { buildLetterPdf } from "@/lib/letter-pdf";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/profile";
import type { NormalizedResult } from "@/types/results";

function Segmented<T extends string>({
  legend, value, onChange, options,
}: {
  legend: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "border px-3 py-2.5 text-sm transition-colors",
              value === o.value ? "border-primary bg-accent font-medium text-primary" : "border-border hover:bg-muted"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border border-border bg-card p-4 sm:p-5">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function LetterEditor({
  runId, index, result, profile,
}: {
  runId: string;
  index: number;
  result: NormalizedResult;
  profile: Profile;
}) {
  // Ce composant n'est monté qu'après l'hydratation : lire la date ici est sans risque pour le prérendu
  const [today] = useState(() => new Date());

  const job: LetterJob = useMemo(
    () => ({
      title: result.title,
      company: result.tagline, // pour une offre, la 2e ligne est l'entreprise
      recruiterName: typeof result.raw.jobPosterName === "string" ? result.raw.jobPosterName : null,
    }),
    [result]
  );
  const matched = useMemo(() => createJobScorer(profile)(result)?.matchedSkills ?? [], [profile, result]);

  const [options, setOptions] = useState<LetterOptions>(() => ({
    // Français par défaut ; anglais seulement si l'offre est nettement rédigée en anglais
    language: detectOfferLanguage([result.title, result.description].filter(Boolean).join(" ")),
    tone: "formal",
    addressRecruiter: false,
    mentionCv: true,
  }));
  const [body, setBody] = useState(() => generateLetterBody(profile, job, matched, options));
  const [bodyEdited, setBodyEdited] = useState(false);
  const [subject, setSubject] = useState(() => defaultSubject(job, options.language));
  const [subjectEdited, setSubjectEdited] = useState(false);
  const [to, setTo] = useState(result.emails[0] ?? "");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Prévient avant de quitter la page avec une lettre modifiée à la main
  useEffect(() => {
    if (!bodyEdited) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [bodyEdited]);

  function updateOptions(patch: Partial<LetterOptions>) {
    const next = { ...options, ...patch };
    setOptions(next);
    // Une lettre retouchée à la main n'est jamais écrasée sans ton accord (bouton « Régénérer »)
    if (!bodyEdited) setBody(generateLetterBody(profile, job, matched, next));
    if (patch.language && !subjectEdited) setSubject(defaultSubject(job, next.language));
  }

  function regenerate() {
    setBody(generateLetterBody(profile, job, matched, options));
    setBodyEdited(false);
    if (!subjectEdited) setSubject(defaultSubject(job, options.language));
  }

  const header = buildLetterHeader(profile, job, options.language, today, subject);
  const mailBody = emailText(body, profile);
  const toValid = to.trim() === "" || isValidEmail(to);
  const gmail = gmailLink(isValidEmail(to) ? to : "", subject, mailBody);
  const mailto = mailtoLink(isValidEmail(to) ? to : "", subject, mailBody);
  const linksTooLong = gmail.length > MAX_LINK_CHARS;

  async function downloadPdf() {
    setPdfBusy(true);
    setNote(null);
    try {
      const { bytes, replacedChars } = await buildLetterPdf(`${header}\n\n${body}`, {
        title: subject,
        author: profile.fullName || "ActorHub",
      });
      const label = slugify(job.company ?? job.title ?? "candidature");
      downloadFile(new Uint8Array(bytes), `lettre-${label}-${today.toISOString().slice(0, 10)}.pdf`, "application/pdf");
      if (replacedChars > 0) {
        setNote(`${replacedChars} caractère${replacedChars > 1 ? "s" : ""} spécia${replacedChars > 1 ? "ux ont" : "l a"} été remplacé${replacedChars > 1 ? "s" : ""} dans le PDF (non pris en charge par sa police).`);
      }
    } catch {
      setNote("Création du PDF impossible. Copie le texte à la place.");
    } finally {
      setPdfBusy(false);
    }
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(mailBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setNote("Copie impossible : sélectionne le texte et copie-le à la main.");
    }
  }

  const offerHref = `/searches/${runId}/results/${index}`;
  const missingName = profile.fullName.trim() === "";

  return (
    <>
      <PageHeader
        title="Candidature"
        description={[job.title, job.company].filter(Boolean).join(" · ") || "Offre"}
        actions={
          <Button render={<Link href={offerHref} />} nativeButton={false} variant="outline" className="h-9 gap-2">
            <ArrowLeft className="size-4" /> Retour à l&apos;offre
          </Button>
        }
      />

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          {missingName && (
            <p className="border-l-2 border-highlight bg-highlight/10 px-4 py-3 text-sm">
              Ton nom n&apos;est pas renseigné : la lettre ne sera pas signée.{" "}
              <Link href="/profile" className="text-primary hover:underline">Compléter mon profil</Link>
            </p>
          )}

          <Section title="Réglages">
            <div className="grid gap-4 sm:grid-cols-2">
              <Segmented<Language>
                legend="Langue"
                value={options.language}
                onChange={(language) => updateOptions({ language })}
                options={[{ value: "fr", label: "Français" }, { value: "en", label: "English" }]}
              />
              <Segmented<Tone>
                legend="Ton"
                value={options.tone}
                onChange={(tone) => updateOptions({ tone })}
                options={[{ value: "formal", label: "Formel" }, { value: "friendly", label: "Cordial" }]}
              />
            </div>
            {job.recruiterName && (
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={options.addressRecruiter} onChange={(e) => updateOptions({ addressRecruiter: e.target.checked })} className="size-4 accent-primary" />
                M&apos;adresser à {job.recruiterName.split(/\s+/)[0]} (recruteur indiqué sur l&apos;offre)
              </label>
            )}
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={options.mentionCv} onChange={(e) => updateOptions({ mentionCv: e.target.checked })} className="size-4 accent-primary" />
              Mentionner mon CV en pièce jointe
            </label>
          </Section>

          <Section title="Destinataire et objet">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="l-to">Email du destinataire (facultatif)</Label>
                <Input id="l-to" type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="recrutement@entreprise.com" aria-invalid={!toValid} className="h-10" />
                {!toValid && <p className="text-sm text-destructive">Adresse email invalide</p>}
                {result.emails.length === 0 && (
                  <p className="text-xs text-muted-foreground">Les offres LinkedIn n&apos;indiquent presque jamais d&apos;adresse.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="l-subject">Objet</Label>
                <Input id="l-subject" value={subject} onChange={(e) => { setSubject(e.target.value); setSubjectEdited(true); }} className="h-10" />
              </div>
            </div>
          </Section>

          <Section title="Ta lettre">
            {/* Aperçu de l'en-tête qui sera ajouté dans le PDF (non modifiable ici : il vient de ton profil et de l'objet) */}
            <div>
              <p className="mb-1 text-xs text-muted-foreground">En-tête ajouté automatiquement dans le PDF</p>
              <pre className="whitespace-pre-wrap wrap-words bg-muted p-3 font-sans text-sm text-muted-foreground">{header}</pre>
            </div>
            <div className="space-y-2">
              <Label htmlFor="l-body">Texte de la lettre (modifiable)</Label>
              <Textarea id="l-body" value={body} onChange={(e) => { setBody(e.target.value); setBodyEdited(true); }} rows={20} spellCheck />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{body.length.toLocaleString("fr-FR")} caractères</span>
                <button type="button" onClick={regenerate} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                  <RefreshCw className="size-3.5" />
                  {bodyEdited ? "Régénérer (remplace mes modifications)" : "Régénérer"}
                </button>
              </div>
              {bodyEdited && (
                <p className="text-xs text-muted-foreground">
                  Tu as modifié le texte : changer la langue ou le ton ne le réécrira pas tant que tu ne cliques pas sur « Régénérer ».
                </p>
              )}
            </div>
          </Section>
        </div>

        {/* ===== Actions ===== */}
        <aside className="h-fit space-y-3 border border-border bg-card p-4 lg:sticky lg:top-6">
          <h2 className="text-sm font-semibold">Dossier de candidature</h2>

          <Button type="button" onClick={downloadPdf} disabled={pdfBusy} className="h-10 w-full gap-2">
            <Download className="size-4" /> {pdfBusy ? "Création du PDF…" : "Télécharger la lettre (PDF)"}
          </Button>
          <Button type="button" variant="outline" onClick={copyText} className="h-10 w-full gap-2">
            {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
            {copied ? "Copié" : "Copier le texte"}
          </Button>

          {linksTooLong ? (
            <p className="border-l-2 border-highlight bg-highlight/10 px-3 py-2 text-xs">
              Le texte est trop long pour un lien d&apos;email : copie-le puis colle-le dans ton message.
            </p>
          ) : (
            <>
              <Button variant="outline" className="h-10 w-full gap-2" render={<a href={gmail} target="_blank" rel="noopener noreferrer" />} nativeButton={false}>
                <ExternalLink className="size-4" /> Ouvrir dans Gmail
              </Button>
              <Button variant="outline" className="h-10 w-full gap-2" render={<a href={mailto} />} nativeButton={false}>
                <Mail className="size-4" /> Ouvrir mon application mail
              </Button>
            </>
          )}

          {note && <p role="status" className="border-l-2 border-primary bg-accent px-3 py-2 text-xs">{note}</p>}

          <p className="border-t border-border pt-3 text-xs text-muted-foreground">
            Un lien d&apos;email ne peut pas contenir de pièce jointe : joins toi-même le PDF de la lettre et
            ton CV avant d&apos;envoyer. Relis toujours le texte avant l&apos;envoi.
          </p>
        </aside>
      </div>
    </>
  );
}