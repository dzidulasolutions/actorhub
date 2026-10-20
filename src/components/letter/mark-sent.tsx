"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recordSent } from "@/hooks/use-sent-log";
import type { SentPurpose } from "@/lib/sent-log";

// Pour les envois faits hors de l'app (Gmail, application mail) : l'app ne peut pas le savoir toute seule
export function MarkSentButton({
  to, toValid, subject, company, refKey, purpose,
}: {
  to: string;
  toValid: boolean;
  subject: string;
  company: string | null;
  refKey: string | null;
  purpose: SentPurpose;
}) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function mark() {
    if (!toValid || to.trim() === "") return setError("Saisis d'abord l'adresse email du destinataire.");
    recordSent({ to: to.trim(), subject: subject.trim(), company, sentAt: new Date().toISOString(), ref: refKey, purpose });
    setError(null);
    setDone(true);
  }

  return (
    <div className="space-y-2 border-t border-border pt-3">
      <h3 className="text-sm font-semibold">Envoyé depuis Gmail ou ton application mail ?</h3>
      {done ? (
        <p role="status" className="flex items-center gap-2 text-sm text-success">
          <Check className="size-4" /> Noté.{" "}
          <Link href="/tracking" className="text-primary hover:underline">Voir le suivi</Link>
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Note-le pour le retrouver dans le suivi et être prévenu quand une relance est possible. Inutile si tu as utilisé
            « Envoyer » ci-dessous : c&apos;est déjà noté.
          </p>
          <Button type="button" variant="outline" onClick={mark} className="h-9 w-full">J&apos;ai envoyé ce message</Button>
          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        </>
      )}
    </div>
  );
}