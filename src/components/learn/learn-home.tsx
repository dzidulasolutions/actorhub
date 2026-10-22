"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Download, FileUp, FlaskConical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { useLearnPacks, useLearnSettings } from "@/hooks/use-learn";
import { downloadJson, slugify } from "@/lib/export-json";
import { loadPack, type PackMeta } from "@/lib/learn/learn-db";
import { importPack, removePack } from "@/lib/learn/learn-store";
import { exportPack, MAX_PACK_CHARS, parsePack } from "@/lib/learn/pack-utils";
import { SAMPLE_PACK } from "@/lib/learn/sample-pack";
import { LEVELS, SKILL_LABELS, SLOT_LABELS } from "@/lib/learn/schema";
import { LearnSkeleton } from "./learn-skeleton";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

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

export function LearnHome() {
  const { packs, ready: packsReady, error } = useLearnPacks();
  const { settings, ready } = useLearnSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [withTranscripts, setWithTranscripts] = useState<Record<string, boolean>>({});
  const [toDelete, setToDelete] = useState<PackMeta | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!ready || !packsReady) return <LearnSkeleton />;

  async function loadSample() {
    setBusy(true);
    setMessage(null);
    try {
      const meta = await importPack(SAMPLE_PACK);
      setMessage({ kind: "ok", text: `Pack d'exemple chargé : ${meta.stats.vocabulary} mots, ${meta.stats.grammar} points de grammaire.` });
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof Error ? e.message : "Chargement impossible" });
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(file: File) {
    setMessage(null);
    if (file.size > MAX_PACK_CHARS) {
      setMessage({ kind: "error", text: "Fichier trop volumineux (20 Mo maximum)" });
      return;
    }
    setBusy(true);
    try {
      const result = parsePack(await file.text());
      if (!result.ok) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      const meta = await importPack(result.value);
      setMessage({ kind: "ok", text: `Pack « ${meta.name} » importé : ${meta.stats.vocabulary} mots, ${meta.stats.grammar} points de grammaire, ${meta.stats.videos} vidéos.` });
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof Error ? e.message : "Import impossible" });
    } finally {
      setBusy(false);
    }
  }

  async function handleExport(meta: PackMeta) {
    setMessage(null);
    try {
      const pack = await loadPack(meta.id);
      if (!pack) {
        setMessage({ kind: "error", text: "Ce pack est introuvable dans le navigateur." });
        return;
      }
      const date = new Date().toISOString().slice(0, 10);
      downloadJson(exportPack(pack, withTranscripts[meta.id] ?? true), `actorhub-pack-${slugify(meta.name)}-${date}.json`);
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof Error ? e.message : "Export impossible" });
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleteOpen(false); // la modale se ferme toujours elle-même
    try {
      await removePack(toDelete.id);
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof Error ? e.message : "Suppression impossible" });
    }
  }

  return (
    <>
      <PageHeader
        title="Apprendre"
        description="Tes ressources et ton programme d'apprentissage"
        actions={
          <Button render={<Link href="/learn/setup" />} nativeButton={false} className="h-9">
            {settings ? "Modifier mes réglages" : "Régler mon programme"}
          </Button>
        }
      />

      <div className="max-w-4xl space-y-6 p-5 sm:p-6">
        {(message || error) && (
          <p
            role={message?.kind === "ok" ? "status" : "alert"}
            className={
              message?.kind === "ok"
                ? "border-l-2 border-success bg-success/10 px-4 py-3 text-sm text-success"
                : "border-l-2 border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
            }
          >
            {message?.text ?? error}
          </p>
        )}

        <Section
          title="Ressources"
          description="Les packs contiennent le vocabulaire, la grammaire, les lectures et les vidéos. Tu peux en importer plusieurs : le programme les combinera."
        >
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            aria-label="Choisir un pack JSON"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = ""; // permet de rechoisir le même fichier
              if (file) void handleFile(file);
            }}
          />

          {packs && packs.length === 0 ? (
            <div className="grid place-items-center gap-3 border border-dashed border-border px-6 py-10 text-center">
              <span className="grid size-12 place-items-center bg-black text-white"><FlaskConical className="size-6" /></span>
              <div className="space-y-1">
                <p className="font-medium">Aucun pack de ressources</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Charge le pack d&apos;exemple pour essayer, ou importe un fichier JSON préparé à partir de tes cours.
                </p>
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {packs?.map((p) => (
                <li key={p.id} className="space-y-4 border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="min-w-0 truncate font-medium">{p.name}</h3>
                    <span className="text-xs text-muted-foreground">Importé le {dateFormat.format(new Date(p.importedAt))}</span>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
                    {[
                      ["Vocabulaire", p.stats.vocabulary],
                      ["Grammaire", p.stats.grammar],
                      ["Vidéos", p.stats.videos],
                      ["Lectures", p.stats.readings],
                      ["Prononciation", p.stats.pronunciation],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-xs text-muted-foreground">{label}</dt>
                        <dd className="text-lg font-semibold leading-tight">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div>
                    <p className="mb-1.5 text-xs text-muted-foreground">Mots par niveau</p>
                    <div className="grid grid-cols-6 gap-2">
                      {LEVELS.map((l) => (
                        <div key={l} className="bg-muted px-2 py-1.5 text-center">
                          <p className="text-xs text-muted-foreground">{l}</p>
                          <p className="text-sm font-medium">{p.stats.vocabularyByLevel[l]}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="button" variant="outline" onClick={() => handleExport(p)} className="h-9 gap-2">
                      <Download className="size-4" /> Exporter (JSON)
                    </Button>
                    {p.stats.transcripts > 0 && (
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={withTranscripts[p.id] ?? true}
                          onChange={(e) => setWithTranscripts((m) => ({ ...m, [p.id]: e.target.checked }))}
                          className="size-4 accent-primary"
                        />
                        Inclure les transcriptions
                      </label>
                    )}
                    <button
                      type="button"
                      onClick={() => { setToDelete(p); setDeleteOpen(true); }}
                      aria-label={`Supprimer ${p.name}`}
                      className="ml-auto grid size-9 place-items-center border border-border text-muted-foreground transition-colors hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="h-9 gap-2">
              <FileUp className="size-4" /> {busy ? "Lecture…" : "Importer un pack (JSON)"}
            </Button>
            {packs && packs.length === 0 && (
              <Button type="button" variant="outline" onClick={loadSample} disabled={busy} className="h-9">
                Charger le pack d&apos;exemple
              </Button>
            )}
          </div>
        </Section>

        <Section title="Programme">
          {settings ? (
            <>
              <p className="text-sm">
                <span className="font-medium">{settings.level} → {settings.targetLevel}</span>
                {" · "}{settings.days} jours{" · "}{settings.minutesPerDay} min par jour{" · "}
                {settings.slots.map((s) => SLOT_LABELS[s]).join(", ")}
              </p>
              <p className="text-sm text-muted-foreground">
                {settings.skills.map((s) => SKILL_LABELS[s]).join(", ")}
              </p>
              <p className="border-l-2 border-primary bg-accent px-4 py-3 text-xs">
                La génération du programme jour par jour arrive à l&apos;étape suivante : tes réglages sont déjà enregistrés.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun réglage enregistré : choisis ton niveau, ton temps par jour, tes compétences, tes thèmes et tes chaînes.
            </p>
          )}
        </Section>

        <p className="text-xs text-muted-foreground">
          Les packs sont enregistrés dans ce navigateur : ils disparaissent si tu vides les données du site. Exporte-les pour en garder une copie.
        </p>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce pack ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {toDelete?.name} » sera effacé de ce navigateur. Les fichiers JSON déjà exportés ne sont pas touchés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}