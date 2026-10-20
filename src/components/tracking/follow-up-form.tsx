"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateSent } from "@/hooks/use-sent-log";
import { emailText, gmailLink, mailtoLink, MAX_LINK_CHARS, type Language } from "@/lib/cover-letter";
import type { SentEntry } from "@/lib/sent-log";
import { entryKey, generateFollowUp, guessLanguage } from "@/lib/tracking";
import type { Profile } from "@/types/profile";
import { Segmented } from "../letter/form-parts";

export function FollowUpForm({ entry, profile, onDone }: { entry: SentEntry; profile: Profile; onDone: () => void }) {
  const [language, setLanguage] = useState<Language>(() => guessLanguage(entry.subject));
  const [body, setBody] = useState(() => generateFollowUp(profile, entry, language));
  const [edited, setEdited] = useState(false);
  const [subject, setSubject] = useState(() => (/^re:/i.test(entry.subject) ? entry.subject : `Re: ${entry.subject}`));
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  function changeLanguage(l: Language) {
    setLanguage(l);
    if (!edited) setBody(generateFollowUp(profile, entry, l)); // un texte retouché n'est jamais écrasé
  }

  const mailBody = emailText(body, profile);
  const gmail = gmailLink(entry.to, subject, mailBody);

  async function copy() {
    try {
      await navigator.clipboard.writeText(mailBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setNote("Copie impossible : sélectionne le texte et copie-le à la main.");
    }
  }

  // Tu as envoyé la relance : le prochain rappel repart de maintenant
  function markDone() {
    updateSent(entryKey(entry), { followUps: (entry.followUps ?? 0) + 1, followedUpAt: new Date().toISOString() });
    onDone();
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
      <Segmented<Language>
        legend="Langue"
        value={language}
        onChange={changeLanguage}
        options={[{ value: "fr", label: "Français" }, { value: "en", label: "English" }]}
      />

      <div className="space-y-2">
        <Label htmlFor="fu-subject">Objet</Label>
        <Input id="fu-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="h-10" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fu-body">Message (modifiable)</Label>
        <Textarea id="fu-body" value={body} onChange={(e) => { setBody(e.target.value); setEdited(true); }} rows={12} spellCheck />
      </div>

      <div className="space-y-2">
        <Button type="button" variant="outline" onClick={copy} className="h-10 w-full gap-2">
          {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
          {copied ? "Copié" : "Copier le texte"}
        </Button>
        {gmail.length <= MAX_LINK_CHARS && (
          <>
            <Button variant="outline" className="h-10 w-full gap-2" render={<a href={gmail} target="_blank" rel="noopener noreferrer" />} nativeButton={false}>
              <ExternalLink className="size-4" /> Ouvrir dans Gmail
            </Button>
            <Button variant="outline" className="h-10 w-full gap-2" render={<a href={mailtoLink(entry.to, subject, mailBody)} />} nativeButton={false}>
              <Mail className="size-4" /> Ouvrir mon application mail
            </Button>
          </>
        )}
        {note && <p role="status" className="text-xs text-muted-foreground">{note}</p>}
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <Button type="button" onClick={markDone} className="h-10 w-full">J&apos;ai envoyé la relance</Button>
        <p className="text-xs text-muted-foreground">
          Le prochain rappel repartira d&apos;aujourd&apos;hui. L&apos;app suggère au plus {2} relances par contact : au-delà, mieux vaut passer à autre chose.
        </p>
      </div>
    </div>
  );
}