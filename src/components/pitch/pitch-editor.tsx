"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, Globe, Phone, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/page-header";
import { useSentLog } from "@/hooks/use-sent-log";
import { buildLetterHeader, emailText, isValidEmail, type Language, type Tone } from "@/lib/cover-letter";
import { slugify } from "@/lib/export-json";
import { jobKey } from "@/lib/job-notes";
import { hostOf } from "@/lib/normalize-results";
import {
  defaultPitchSubject, generatePitchBody, MAX_PITCH_SERVICES, observeCompany,
  type Observation, type PitchOptions,
} from "@/lib/pitch";
import { findSendByRef } from "@/lib/sent-log";
import type { Profile } from "@/types/profile";
import type { NormalizedResult } from "@/types/results";
import { Section, Segmented } from "../letter/form-parts";
import { SendPanel } from "../letter/send-panel";
import { ShareActions } from "../letter/share-actions";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function PitchEditor({
  runId, index, result, profile,
}: {
  runId: string;
  index: number;
  result: NormalizedResult;
  profile: Profile;
}) {
  // Monté seulement après l'hydratation : lire la date ici est sans risque pour le prérendu
  const [today] = useState(() => new Date());
  const company = result.title ?? hostOf(result.website);
  const refKey = jobKey(result);
  const sentLog = useSentLog();
  const previousContact = findSendByRef(sentLog, refKey);

  const observations = useMemo(() => observeCompany(result), [result]);
  const services = useMemo(() => profile.services.filter((s) => s.name.trim() !== ""), [profile.services]);

  const [options, setOptions] = useState<PitchOptions>({
    language: "fr",
    tone: "formal",
    includeObservations: true,
    includePortfolio: true,
  });
  const [chosenServices, setChosenServices] = useState<Set<number>>(
    () => new Set(services.slice(0, MAX_PITCH_SERVICES).map((_, i) => i))
  );
  const [chosenObs, setChosenObs] = useState<Set<Observation["key"]>>(() => new Set(observations.map((o) => o.key)));

  const build = (o: PitchOptions, svc: Set<number>, obs: Set<Observation["key"]>) =>
    generatePitchBody(profile, company, services.filter((_, i) => svc.has(i)), observations.filter((x) => obs.has(x.key)), o);

  const [body, setBody] = useState(() => build(options, chosenServices, chosenObs));
  const [bodyEdited, setBodyEdited] = useState(false);
  const [subject, setSubject] = useState(() => defaultPitchSubject(company, options.language));
  const [subjectEdited, setSubjectEdited] = useState(false);
  const [to, setTo] = useState(result.emails[0] ?? "");

  // Prévient avant de quitter la page avec un message modifié à la main
  useEffect(() => {
    if (!bodyEdited) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [bodyEdited]);

  // Un texte retouché à la main n'est jamais écrasé sans ton accord (bouton « Régénérer »)
  function update(next: { options?: PitchOptions; services?: Set<number>; obs?: Set<Observation["key"]> }) {
    const o = next.options ?? options;
    const svc = next.services ?? chosenServices;
    const obs = next.obs ?? chosenObs;
    if (next.options) setOptions(o);
    if (next.services) setChosenServices(svc);
    if (next.obs) setChosenObs(obs);
    if (!bodyEdited) setBody(build(o, svc, obs));
    if (next.options && next.options.language !== options.language && !subjectEdited) {
      setSubject(defaultPitchSubject(company, o.language));
    }
  }

  function toggleService(i: number) {
    const next = new Set(chosenServices);
    if (next.has(i)) next.delete(i);
    else if (next.size < MAX_PITCH_SERVICES) next.add(i);
    update({ services: next });
  }

  function toggleObservation(key: Observation["key"]) {
    const next = new Set(chosenObs);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    update({ obs: next });
  }

  function regenerate() {
    setBody(build(options, chosenServices, chosenObs));
    setBodyEdited(false);
    if (!subjectEdited) setSubject(defaultPitchSubject(company, options.language));
  }

  const header = buildLetterHeader(profile, { title: null, company, recruiterName: null }, options.language, today, subject);
  const mailBody = emailText(body, profile);
  const toValid = to.trim() === "" || isValidEmail(to);
  const pdfFilename = `proposition-${slugify(company ?? "entreprise")}-${today.toISOString().slice(0, 10)}.pdf`;
  const author = profile.fullName || "ActorHub";
  const factHref = `/searches/${runId}/results/${index}`;

  return (
    <>
      <PageHeader
        title="Proposition de services"
        description={company ?? "Entreprise"}
        actions={
          <Button render={<Link href={factHref} />} nativeButton={false} variant="outline" className="h-9 gap-2">
            <ArrowLeft className="size-4" /> Retour à la fiche
          </Button>
        }
      />

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          {previousContact && (
            <p className="border-l-2 border-highlight bg-highlight/10 px-4 py-3 text-sm">
              Tu as déjà écrit à cette entreprise le {dateFormat.format(new Date(previousContact.sentAt))} ({previousContact.to}).
              Une relance est possible, mais évite de renvoyer le même message.
            </p>
          )}
          {services.length === 0 && (
            <p className="border-l-2 border-highlight bg-highlight/10 px-4 py-3 text-sm">
              Tu n&apos;as décrit aucun service : le message resterait vague.{" "}
              <Link href="/profile" className="text-primary hover:underline">Ajouter mes services</Link>
            </p>
          )}
          {profile.fullName.trim() === "" && (
            <p className="border-l-2 border-highlight bg-highlight/10 px-4 py-3 text-sm">
              Ton nom n&apos;est pas renseigné : le message ne sera pas signé.{" "}
              <Link href="/profile" className="text-primary hover:underline">Compléter mon profil</Link>
            </p>
          )}

          <Section title="Réglages">
            <div className="grid gap-4 sm:grid-cols-2">
              <Segmented<Language>
                legend="Langue"
                value={options.language}
                onChange={(language) => update({ options: { ...options, language } })}
                options={[{ value: "fr", label: "Français" }, { value: "en", label: "English" }]}
              />
              <Segmented<Tone>
                legend="Ton"
                value={options.tone}
                onChange={(tone) => update({ options: { ...options, tone } })}
                options={[{ value: "formal", label: "Formel" }, { value: "friendly", label: "Cordial" }]}
              />
            </div>
            {profile.website.trim() !== "" && (
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={options.includePortfolio}
                  onChange={(e) => update({ options: { ...options, includePortfolio: e.target.checked } })}
                  className="size-4 accent-primary"
                />
                Ajouter le lien de mes réalisations
              </label>
            )}
          </Section>

          <Section title="Ce que tu mets dans le message">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">
                Mes services <span className="font-normal text-muted-foreground">({MAX_PITCH_SERVICES} maximum)</span>
              </legend>
              {services.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun service décrit dans ton profil.</p>
              ) : (
                services.map((s, i) => {
                  const checked = chosenServices.has(i);
                  return (
                    <label key={i} className="flex cursor-pointer items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!checked && chosenServices.size >= MAX_PITCH_SERVICES}
                        onChange={() => toggleService(i)}
                        className="mt-0.5 size-4 accent-primary"
                      />
                      <span className="min-w-0">
                        <span className="font-medium">{s.name}</span>
                        {s.description && <span className="block text-muted-foreground">{s.description}</span>}
                      </span>
                    </label>
                  );
                })
              )}
            </fieldset>

            <fieldset className="space-y-2 border-t border-border pt-4">
              <legend className="text-sm font-medium">Ce que la fiche montre</legend>
              {observations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Rien d&apos;exploitable dans les données de cette fiche : le message reste général. Ajoute toi-même un détail
                  que tu as vraiment constaté.
                </p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    Observé dans les données de la fiche. Décoche ce que tu ne veux pas mentionner.
                  </p>
                  {observations.map((o) => (
                    <label key={o.key} className="flex cursor-pointer items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={chosenObs.has(o.key)}
                        onChange={() => toggleObservation(o.key)}
                        className="mt-0.5 size-4 accent-primary"
                      />
                      {cap(options.language === "fr" ? o.fr : o.en)}
                    </label>
                  ))}
                </>
              )}
            </fieldset>
          </Section>

          <Section title="Destinataire et objet">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pi-to">Email du destinataire</Label>
                <Input id="pi-to" type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="contact@entreprise.com" aria-invalid={!toValid} className="h-10" />
                {!toValid && <p className="text-sm text-destructive">Adresse email invalide</p>}
                {result.emails.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Aucun email trouvé pour cette fiche. Cherche-le sur son site ou sa page, ou contacte-la autrement (colonne de droite).
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pi-subject">Objet</Label>
                <Input id="pi-subject" value={subject} onChange={(e) => { setSubject(e.target.value); setSubjectEdited(true); }} className="h-10" />
              </div>
            </div>
          </Section>

          <Section title="Ton message">
            <div>
              <p className="mb-1 text-xs text-muted-foreground">En-tête ajouté automatiquement dans le PDF</p>
              <pre className="whitespace-pre-wrap wrap-words bg-muted p-3 font-sans text-sm text-muted-foreground">{header}</pre>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pi-body">Texte du message (modifiable)</Label>
              <Textarea id="pi-body" value={body} onChange={(e) => { setBody(e.target.value); setBodyEdited(true); }} rows={20} spellCheck />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{body.length.toLocaleString("fr-FR")} caractères</span>
                <button type="button" onClick={regenerate} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                  <RefreshCw className="size-3.5" />
                  {bodyEdited ? "Régénérer (remplace mes modifications)" : "Régénérer"}
                </button>
              </div>
              {bodyEdited && (
                <p className="text-xs text-muted-foreground">
                  Tu as modifié le texte : changer la langue, le ton ou les cases ci-dessus ne le réécrira pas tant que tu ne cliques pas sur « Régénérer ».
                </p>
              )}
            </div>
          </Section>
        </div>

        {/* ===== Actions et coordonnées ===== */}
        <aside className="h-fit space-y-3 border border-border bg-card p-4 lg:sticky lg:top-6">
          <h2 className="text-sm font-semibold">Proposition</h2>

          <ShareActions
            mailBody={mailBody}
            subject={subject}
            to={to}
            pdfText={`${header}\n\n${body}`}
            pdfFilename={pdfFilename}
            author={author}
            pdfLabel="Télécharger la proposition (PDF)"
          />

          <SendPanel
            purpose="pitch"
            refKey={refKey}
            to={to}
            toValid={toValid}
            subject={subject}
            mailBody={mailBody}
            letterText={`${header}\n\n${body}`}
            pdfFilename={pdfFilename}
            company={company}
            mentionCv={false}
            author={author}
          />

          <section className="space-y-2 border-t border-border pt-3 text-sm">
            <h3 className="text-sm font-semibold">Contacter autrement</h3>
            {result.phones[0] && (
              <a href={`tel:${result.phones[0].replace(/[^\d+]/g, "")}`} className="flex items-center gap-2 hover:underline">
                <Phone className="size-4 shrink-0 text-muted-foreground" /> <span className="truncate">{result.phones[0]}</span>
              </a>
            )}
            {result.website && (
              <a href={result.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                <Globe className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 truncate">{hostOf(result.website)}</span>
                {result.websiteIsDirectory && <span className="shrink-0 bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">Annuaire</span>}
              </a>
            )}
            {result.socials.slice(0, 3).map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 truncate capitalize">{s.network}</span>
              </a>
            ))}
            {!result.phones[0] && !result.website && result.socials.length === 0 && (
              <p className="text-xs text-muted-foreground">Aucune autre coordonnée dans les données.</p>
            )}
          </section>

          <p className="border-t border-border pt-3 text-xs text-muted-foreground">
            Un message par entreprise, personnalisé, avec ton identité et une façon claire de ne plus être contacté. Les règles sur la
            prospection varient selon le pays du destinataire : vérifie celles qui s&apos;appliquent.
          </p>
        </aside>
      </div>
    </>
  );
}