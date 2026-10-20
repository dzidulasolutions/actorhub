// src/components/letter/share-actions.tsx
"use client";

import { useState } from "react";
import { Check, Copy, Download, ExternalLink, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gmailLink, isValidEmail, mailtoLink, MAX_LINK_CHARS } from "@/lib/cover-letter";
import { downloadFile } from "@/lib/export-json";
import { buildLetterPdf } from "@/lib/letter-pdf";

export function ShareActions({
  mailBody, subject, to, pdfText, pdfFilename, author, pdfLabel,
}: {
  mailBody: string;
  subject: string;
  to: string;
  pdfText: string;
  pdfFilename: string;
  author: string;
  pdfLabel: string;
}) {
  const [pdfBusy, setPdfBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const recipient = isValidEmail(to) ? to : "";
  const gmail = gmailLink(recipient, subject, mailBody);
  const mailto = mailtoLink(recipient, subject, mailBody);

  async function downloadPdf() {
    setPdfBusy(true);
    setNote(null);
    try {
      const { bytes, replacedChars } = await buildLetterPdf(pdfText, { title: subject, author });
      downloadFile(new Uint8Array(bytes), pdfFilename, "application/pdf");
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

  return (
    <div className="space-y-3">
      <Button type="button" onClick={downloadPdf} disabled={pdfBusy} className="h-10 w-full gap-2">
        <Download className="size-4" /> {pdfBusy ? "Création du PDF…" : pdfLabel}
      </Button>
      <Button type="button" variant="outline" onClick={copyText} className="h-10 w-full gap-2">
        {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
        {copied ? "Copié" : "Copier le texte"}
      </Button>

      {gmail.length > MAX_LINK_CHARS ? (
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
    </div>
  );
}