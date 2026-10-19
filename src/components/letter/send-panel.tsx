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
import { findPreviousSend } from "@/lib/sent-log";

type Status =
  | { state: "loading" }
  | { state: "error"; text: string }
  | { state: "ready"; configured: boolean; from: string | null };

interface CvFile {
  name: string;
  mime: AllowedMime;
  bytes: Uint8Array;
}

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document" as const;
const mimeOf = (name: string): AllowedMime | null => {
  const ext = name.toLowerCase().split(".").pop();
  return ext === "pdf" ? "application/pdf" : ext === "docx" ? DOCX : null;
};
const fmtSize = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} Ko` : `${(n / 1024 / 1024).toFixed(1)} Mo`);
const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

export function SendPanel({
  to, toValid, subject, mailBody, letterText, pdfFilename, company, mentionCv, author,
}: {
  to: string;
  toValid: boolean;
  subject: string;
  mailBody: string; // texte de l'email (lettre + coordonnées)
  letterText: string; // texte du PDF (en-tête + lettre)
  pdfFilename: string;
  company: string | null;
  mentionCv: boolean;
  author: string;
}) {
  const [status, setStatus] = useState<Status>({ state: "loading" });
  const [attachLetter, setAttachLetter] = useState(true);
  const [cv, setCv] = useState<CvFile | null>(null);
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

  async function pickFile(file: File | undefined) {
    if (!file) return;
    setFileError(null);
    const mime = mimeOf(file.name);
    if (!mime) return setFileError("Format non pris en charge : utilise un PDF ou un .docx");
    if (file.size > MAX_ATTACHMENT_BYTES) return setFileError("Fichier trop volumineux (2 Mo maximum)");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const problem = checkAttachment(mime, bytes); // contrôle du contenu réel, pas seulement du nom
    if (problem) return setFileError(problem);
    setCv({ name: file.name, mime, bytes });
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
      if (attachLetter) {
        const { bytes } = await buildLetterPdf(letterText, { title: subject, author });
        attachments.push({ filename: pdfFilename, mime: "application/pdf", contentBase64: bytesToBase64(bytes) });
      }
      if (cv) attachments.push({ filename: cv.name, mime: cv.mime, contentBase64: bytesToBase64(cv.bytes) });

      await sendMail({ to: to.trim(), subject: subject.trim(), text: mailBody, attachments });
      recordSent({ to: to.trim(), subject: subject.trim(), company, sentAt: new Date().toISOString() });
      setResult({ kind: "ok", text: `Candidature envoyée à ${to.trim()}. Une copie se trouve dans ton dossier « Envoyés » Gmail.` });
    } catch (e) {
      setResult({ kind: "error", text: e instanceof Error ? e.message : "Envoi impossible" });
    } finally {
      setSending(false);
    }
  }

  const previous = confirmOpen ? findPreviousSend(sentLog, to) : null;
  const attachmentSummary = [attachLetter ? "lettre (PDF)" : null, cv ? `${cv.name} (${fmtSize(cv.bytes.length)})` : null].filter(Boolean);

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
            <input type="checkbox" checked={attachLetter} onChange={(e) => setAttachLetter(e.target.checked)} className="size-4 accent-primary" />
            Joindre la lettre en PDF
          </label>

          <div className="space-y-2">
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              aria-label="Choisir mon CV"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = ""; // permet de rechoisir le même fichier
                void pickFile(file);
              }}
            />
            {cv ? (
              <p className="flex items-center justify-between gap-2 border border-border px-3 py-2 text-sm">
                <span className="min-w-0 truncate"><Paperclip className="mr-1.5 inline size-3.5" />{cv.name} · {fmtSize(cv.bytes.length)}</span>
                <button type="button" onClick={() => setCv(null)} aria-label="Retirer le CV" className="shrink-0 text-muted-foreground hover:text-destructive">
                  <X className="size-4" />
                </button>
              </p>
            ) : (
              <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} className="h-9 w-full gap-2">
                <Paperclip className="size-4" /> Joindre mon CV (PDF ou Word)
              </Button>
            )}
            {fileError && <p role="alert" className="text-xs text-destructive">{fileError}</p>}
          </div>

          <Button type="button" onClick={openConfirm} disabled={sending} className="h-10 w-full gap-2">
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {sending ? "Envoi en cours…" : "Envoyer la candidature"}
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
            <AlertDialogTitle>Envoyer cette candidature ?</AlertDialogTitle>
            <AlertDialogDescription render={<div className="space-y-2 text-left" />}>
              <div className="space-y-2 text-left">
                <p><span className="font-medium text-foreground">À :</span> {to.trim()}</p>
                <p><span className="font-medium text-foreground">Objet :</span> {subject.trim()}</p>
                <p>
                  <span className="font-medium text-foreground">Pièces jointes :</span>{" "}
                  {attachmentSummary.length > 0 ? attachmentSummary.join(", ") : "aucune"}
                </p>
                {mentionCv && !cv && (
                  <p className="border-l-2 border-highlight bg-highlight/10 px-3 py-2">
                    Ta lettre indique que ton CV est joint, mais aucun fichier de CV n&apos;est joint.
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