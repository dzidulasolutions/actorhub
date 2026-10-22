"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { TagInput } from "@/components/profile/tag-input";
import { useLearnSettings } from "@/hooks/use-learn";
import {
  defaultSettings, levelIndex, LEVELS, settingsSchema, SKILLS, SKILL_LABELS, SLOT_LABELS, SLOTS,
  type LearnSettings, type Level,
} from "@/lib/learn/schema";
import { saveLearnSettings } from "@/lib/learn/settings-store";
import { cn } from "@/lib/utils";
import { SetupSkeleton } from "./learn-skeleton";

const FIELD_LABELS: Record<string, string> = {
  level: "Niveau actuel",
  targetLevel: "Niveau visé",
  days: "Durée",
  minutesPerDay: "Minutes par jour",
  startDate: "Date de début",
  restDays: "Jours de repos",
  slots: "Créneaux",
  skills: "Compétences",
  themes: "Thèmes",
  channels: "Chaînes",
};

// Du lundi au dimanche ; 0 = dimanche
const WEEK: { value: number; label: string }[] = [
  { value: 1, label: "Lun" }, { value: 2, label: "Mar" }, { value: 3, label: "Mer" }, { value: 4, label: "Jeu" },
  { value: 5, label: "Ven" }, { value: 6, label: "Sam" }, { value: 0, label: "Dim" },
];
const THEME_SUGGESTIONS = ["travel", "landscapes", "daily life", "food", "work", "technology", "health", "culture"];

const toggle = <T,>(list: T[], v: T): T[] => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5 border border-border bg-card p-4 sm:p-5">
      <div className="space-y-1">
        <h2 className="font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

// Bouton de choix carré
function Pill({ active, disabled, onClick, children }: { active: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "border px-3 py-2.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active ? "border-primary bg-accent font-medium text-primary" : "border-border hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

export function SetupPage() {
  const { settings, ready } = useLearnSettings();
  if (!ready) return <SetupSkeleton />;
  // Le formulaire garde son propre brouillon : il n'est créé qu'une fois les réglages lus
  return <SetupForm initial={settings} />;
}

function SetupForm({ initial }: { initial: LearnSettings | null }) {
  const [today] = useState(() => new Date()); // monté après l'hydratation : sans risque pour le prérendu
  const [draft, setDraft] = useState<LearnSettings>(() => initial ?? defaultSettings(today));
  const [baseline, setBaseline] = useState(() => (initial ? JSON.stringify(initial) : "")); // "" = jamais enregistré
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty = JSON.stringify(draft) !== baseline;
  const set = <K extends keyof LearnSettings>(key: K, value: LearnSettings[K]) => setDraft((d) => ({ ...d, [key]: value }));

  // Prévient avant de fermer ou de recharger la page avec des modifications non enregistrées
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [saved]);

  function setLevel(level: Level) {
    // Le niveau visé ne peut pas rester en dessous du niveau actuel
    setDraft((d) => ({ ...d, level, targetLevel: levelIndex(d.targetLevel) < levelIndex(level) ? level : d.targetLevel }));
  }

  function handleSave() {
    const parsed = settingsSchema.safeParse(draft);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setError(`${FIELD_LABELS[String(issue.path[0])] ?? "Réglages"} : ${issue.message}`);
      return;
    }
    if (!saveLearnSettings(parsed.data)) {
      setError("Enregistrement impossible : le stockage du navigateur est plein ou désactivé.");
      return;
    }
    setDraft(parsed.data);
    setBaseline(JSON.stringify(parsed.data));
    setError(null);
    setSaved(true);
  }

  const perSlot = Math.round(draft.minutesPerDay / Math.max(1, draft.slots.length));

  return (
    <>
      <PageHeader
        title="Réglages du programme"
        description="Tu règles une fois, le programme se construit à partir de ça"
        actions={
          <>
            {saved && (
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

      <div className="max-w-3xl space-y-6 p-5 sm:p-6">
        {error && (
          <p role="alert" className="border-l-2 border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
        )}

        <Section title="Niveau" description="Le programme choisit des contenus proches de ton niveau et monte progressivement vers ton objectif.">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Langue</legend>
            <p className="text-sm text-muted-foreground">Anglais. D&apos;autres langues viendront plus tard.</p>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Niveau actuel</legend>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {LEVELS.map((l) => (
                <Pill key={l} active={draft.level === l} onClick={() => setLevel(l)}>{l}</Pill>
              ))}
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Niveau visé</legend>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {LEVELS.map((l) => (
                <Pill key={l} active={draft.targetLevel === l} disabled={levelIndex(l) < levelIndex(draft.level)} onClick={() => set("targetLevel", l)}>
                  {l}
                </Pill>
              ))}
            </div>
          </fieldset>
        </Section>

        <Section title="Rythme">
          <div className="grid gap-5 sm:grid-cols-3">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Durée</legend>
              <div className="grid grid-cols-3 gap-2">
                {([30, 60, 90] as const).map((d) => (
                  <Pill key={d} active={draft.days === d} onClick={() => set("days", d)}>{d} j</Pill>
                ))}
              </div>
            </fieldset>
            <div className="space-y-2">
              <Label htmlFor="ls-minutes">Minutes par jour</Label>
              <Input
                id="ls-minutes"
                type="number"
                min={10}
                max={240}
                step={5}
                value={draft.minutesPerDay}
                onChange={(e) => set("minutesPerDay", Number(e.target.value))}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ls-start">Date de début</Label>
              <Input id="ls-start" type="date" value={draft.startDate} onChange={(e) => set("startDate", e.target.value)} className="h-10" />
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Jours de repos</legend>
            <div className="grid grid-cols-7 gap-2">
              {WEEK.map((d) => {
                const active = draft.restDays.includes(d.value);
                return (
                  <Pill key={d.value} active={active} disabled={!active && draft.restDays.length >= 6} onClick={() => set("restDays", toggle(draft.restDays, d.value))}>
                    {d.label}
                  </Pill>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Créneaux dans la journée</legend>
            <div className="grid grid-cols-3 gap-2">
              {SLOTS.map((s) => (
                <Pill key={s} active={draft.slots.includes(s)} disabled={draft.slots.includes(s) && draft.slots.length === 1} onClick={() => set("slots", toggle(draft.slots, s))}>
                  {SLOT_LABELS[s]}
                </Pill>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {draft.minutesPerDay} min par jour sur {draft.slots.length} créneau{draft.slots.length > 1 ? "x" : ""} : environ {perSlot} min par créneau.
            </p>
          </fieldset>
        </Section>

        <Section title="Compétences" description="Désactive celles que tu ne veux pas travailler : elles n'apparaîtront pas dans le programme.">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SKILLS.map((s) => (
              <Pill key={s} active={draft.skills.includes(s)} disabled={draft.skills.includes(s) && draft.skills.length === 1} onClick={() => set("skills", toggle(draft.skills, s))}>
                {SKILL_LABELS[s]}
              </Pill>
            ))}
          </div>
        </Section>

        <Section title="Thèmes et chaînes" description="Les thèmes orientent le vocabulaire et les vidéos. Les chaînes serviront à la collecte des vidéos.">
          <TagInput
            id="ls-themes"
            label="Thèmes"
            value={draft.themes}
            onChange={(v) => set("themes", v)}
            placeholder="Ex. travel, landscapes"
            max={20}
            hint="Écris-les en anglais, comme dans tes packs (ex. travel). Valide avec Entrée ou une virgule."
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Suggestions :</span>
            {THEME_SUGGESTIONS.filter((t) => !draft.themes.includes(t)).map((t) => (
              <button key={t} type="button" onClick={() => set("themes", [...draft.themes, t])} className="border border-border px-2 py-1 text-xs hover:bg-muted">
                + {t}
              </button>
            ))}
          </div>
          <TagInput
            id="ls-channels"
            label="Chaînes YouTube"
            value={draft.channels}
            onChange={(v) => set("channels", v)}
            placeholder="@nomdelachaine ou lien youtube.com"
            max={20}
            hint="Entre @nom ou un lien youtube.com. Pour les niveaux A1 à B1, privilégie des chaînes faites pour les apprenants."
          />
        </Section>

        <p className="text-xs text-muted-foreground">
          Les réglages sont enregistrés dans ce navigateur. <Link href="/learn" className="text-primary hover:underline">Retour à Apprendre</Link>
        </p>
      </div>
    </>
  );
}