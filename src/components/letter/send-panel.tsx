"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Loader2, Paperclip, Send, X } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { recordSent, useSentLog } from "@/hooks/use-sent-log";
import { getMailStatus, sendMail, type MailAttachmentInput } from "@/lib/api-client";
import { bytesToBase64 } from "@/lib/base64";
import { buildLetterPdf } from "@/lib/letter-pdf";
import { checkAttachment, MAX_ATTACHMENT_BYTES, type AllowedMime } from "@/lib/mail-validation";
import { findPreviousSend, type SentPurpose } from "@/lib/sent-log";

type Status =
  | { state: "loading" }
  | { state: "error"; text: string }
  | { state: "ready"; configured: boolean; from: string | null };

interface AttachedFile {
  name: string;
  mime: AllowedMime;
  bytes: Uint8Array;
}

// Textes selon la nature de l'envoi
const TEXTS = {
  application: {
    attachPdf: "Joindre la lettre en PDF",
    pdfShort: "lettre (PDF)",
    filePick: "Joindre mon CV (PDF ou Word)",
    send: "Envoyer la candidature",
    confirmTitle: "Envoyer cette candidature ?",
    done: (to: string) => `Candidature envoyée à ${to}. Une copie se trouve dans ton dossier « Envoyés » Gmail.`,
  },
  pitch: {
    attachPdf: "Joindre la proposition en PDF",
    pdfShort: "proposition (PDF)",
    filePick: "Joindre un document (PDF ou Word)",
    send: "Envoyer la proposition",
    confirmTitle: "Envoyer cette proposition ?",
    done: (to: string) => `Proposition envoyée à ${to}. Une copie se trouve dans ton dossier « Envoyés » Gmail.`,
  },
} as const;

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document" as const;
const mimeOf = (name: string): AllowedMime | null => {
  const ext = name.toLowerCase().split(".").pop();
  return ext === "pdf" ? "application/pdf" : ext === "docx" ? DOCX : null;
};
const fmtSize = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} Ko` : `${(n / 1024 / 1024).toFixed(1)} Mo`);
const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

export function SendPanel({
  purpose = "application", refKey = null, to, toValid, subject, mailBody, letterText, pdfFilename, company, mentionCv, author,
}: {
  purpose?: SentPurpose;
  refKey?: string | null; // clé de la fiche, pour le journal
  to: string;
  toValid: boolean;
  subject: string;
  mailBody: string; // texte de l'email
  letterText: string; // texte du PDF (en-tête + corps)
  pdfFilename: string;
  company: string | null;
  mentionCv: boolean; // le texte dit « CV ci-joint » (candidatures seulement)
  author: string;
}) {
  const t = TEXTS[purpose];
  const [status, setStatus] = useState<Status>({ state: "loading" });
  const [attachPdf, setAttachPdf] = useState(true);
  const [file, setFile] = useState<AttachedFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sentLog = useSentLog();

  // L'envoi est-il configuré sur ce serveur ? (jamais sur Render gratuit : ports d'envoi bloqués)
  useEffect(() => {
    let alive = true;
    getMailStatus()
      .then((r) => {
        if (alive) setStatus({ state: "ready", configured: r.configured, from: r.from });
      })
      .catch((e) => {
        if (alive) setStatus({ state: "error", text: e instanceof Error ? e.message : "Vérification impossible" });
      });
    return () => {
      alive = false;
    };
  }, []);

  async function pickFile(picked: File | undefined) {
    if (!picked) return;
    setFileError(null);
    const mime = mimeOf(picked.name);
    if (!mime) return setFileError("Format non pris en charge : utilise un PDF ou un .docx");
    if (picked.size > MAX_ATTACHMENT_BYTES) return setFileError("Fichier trop volumineux (2 Mo maximum)");
    const bytes = new Uint8Array(await picked.arrayBuffer());
    const problem = checkAttachment(mime, bytes); // contrôle du contenu réel, pas seulement du nom
    if (problem) return setFileError(problem);
    setFile({ name: picked.name, mime, bytes });
  }

  function openConfirm() {
    setResult(null);
    if (!toValid || to.trim() === "") return setFormError("Saisis l'adresse email du destinataire (section « Destinataire et objet »).");
    if (subject.trim() === "") return setFormError("L'objet est vide.");
    setFormError(null);
    setConfirmOpen(true);
  }

  async function doSend() {
    setSending(true);
    setResult(null);
    try {
      const attachments: MailAttachmentInput[] = [];
      if (attachPdf) {
        const { bytes } = await buildLetterPdf(letterText, { title: subject, author });
        attachments.push({ filename: pdfFilename, mime: "application/pdf", contentBase64: bytesToBase64(bytes) });
      }
      if (file) attachments.push({ filename: file.name, mime: file.mime, contentBase64: bytesToBase64(file.bytes) });

      await sendMail({ to: to.trim(), subject: subject.trim(), text: mailBody, attachments });
      recordSent({ to: to.trim(), subject: subject.trim(), company, sentAt: new Date().toISOString(), ref: refKey, purpose });
      setResult({ kind: "ok", text: t.done(to.trim()) });
    } catch (e) {
      setResult({ kind: "error", text: e instanceof Error ? e.message : "Envoi impossible" });
    } finally {
      setSending(false);
    }
  }

  const previous = confirmOpen ? findPreviousSend(sentLog, to) : null;
  const attachmentSummary = [attachPdf ? t.pdfShort : null, file ? `${file.name} (${fmtSize(file.bytes.length)})` : null].filter(Boolean);

  return (
    <div className="space-y-3 border-t border-border pt-3">
      <h3 className="text-sm font-semibold">Envoyer depuis l&apos;app</h3>

      {status.state === "loading" && (
        <div className="space-y-2" aria-hidden="true">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {status.state === "error" && <p role="alert" className="text-xs text-destructive">{status.text}</p>}

      {status.state === "ready" && !status.configured && (
        <p className="border-l-2 border-highlight bg-highlight/10 px-3 py-2 text-xs">
          L&apos;envoi direct n&apos;est pas configuré sur ce serveur. Utilise « Ouvrir dans Gmail », ou configure-le dans{" "}
          <Link href="/settings" className="text-primary hover:underline">Paramètres</Link>.
        </p>
      )}

      {status.state === "ready" && status.configured && (
        <>
          <p className="text-xs text-muted-foreground">Envoi depuis {status.from}</p>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={attachPdf} onChange={(e) => setAttachPdf(e.target.checked)} className="size-4 accent-primary" />
            {t.attachPdf}
          </label>

          <div className="space-y-2">
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              aria-label={t.filePick}
              className="hidden"
              onChange={(e) => {
                const picked = e.target.files?.[0];
                e.target.value = ""; // permet de rechoisir le même fichier
                void pickFile(picked);
              }}
            />
            {file ? (
              <p className="flex items-center justify-between gap-2 border border-border px-3 py-2 text-sm">
                <span className="min-w-0 truncate"><Paperclip className="mr-1.5 inline size-3.5" />{file.name} · {fmtSize(file.bytes.length)}</span>
                <button type="button" onClick={() => setFile(null)} aria-label="Retirer le fichier" className="shrink-0 text-muted-foreground hover:text-destructive">
                  <X className="size-4" />
                </button>
              </p>
            ) : (
              <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} className="h-9 w-full gap-2">
                <Paperclip className="size-4" /> {t.filePick}
              </Button>
            )}
            {fileError && <p role="alert" className="text-xs text-destructive">{fileError}</p>}
          </div>

          <Button type="button" onClick={openConfirm} disabled={sending} className="h-10 w-full gap-2">
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {sending ? "Envoi en cours…" : t.send}
          </Button>

          {formError && <p role="alert" className="text-xs text-destructive">{formError}</p>}
          {result && (
            <p
              role={result.kind === "error" ? "alert" : "status"}
              className={
                result.kind === "error"
                  ? "border-l-2 border-destructive bg-destructive/10 px-3 py-2 text-xs text-destructive"
                  : "border-l-2 border-success bg-success/10 px-3 py-2 text-xs text-success"
              }
            >
              {result.text}
            </p>
          )}
        </>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription render={<div className="space-y-2 text-left"/>}>
              <div className="space-y-2 text-left">
                <p><span className="font-medium text-foreground">À :</span> {to.trim()}</p>
                <p><span className="font-medium text-foreground">Objet :</span> {subject.trim()}</p>
                <p>
                  <span className="font-medium text-foreground">Pièces jointes :</span>{" "}
                  {attachmentSummary.length > 0 ? attachmentSummary.join(", ") : "aucune"}
                </p>
                {purpose === "application" && mentionCv && !file && (
                  <p className="border-l-2 border-highlight bg-highlight/10 px-3 py-2">
                    Ta lettre indique que ton CV est joint, mais aucun fichier de CV n&apos;est joint.
                  </p>
                )}
                {purpose === "pitch" && (
                  <p className="border-l-2 border-highlight bg-highlight/10 px-3 py-2">
                    Cette entreprise ne t&apos;a rien demandé : relis une dernière fois que le message est clair, honnête et personnalisé.
                  </p>
                )}
                {previous && (
                  <p className="border-l-2 border-highlight bg-highlight/10 px-3 py-2">
                    Tu as déjà écrit à cette adresse le {dateFormat.format(new Date(previous.sentAt))}.
                  </p>
                )}
                <p>Un email envoyé ne peut pas être rappelé.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false); // la modale se ferme toujours elle-même
                void doSend();
              }}
            >
              Envoyer maintenant
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}