import {
  LEVELS, packSchema, settingsSchema,
  type LearnSettings, type Level, type ResourcePack,
} from "./schema";

export const MAX_PACK_CHARS = 20_000_000; // ~20 Mo

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** Retire les balises ```json ... ``` quand le JSON est copié depuis un chat. */
export function stripFences(text: string): string {
  const t = text.trim();
  const m = t.match(/^```[a-zA-Z]*\s*\n([\s\S]*?)\n?```$/);
  return m ? m[1].trim() : t;
}

// Indique OÙ se trouve le défaut (ex. « vocabulary.12.level ») : indispensable pour corriger un fichier généré
function describeIssue(issue: { path: PropertyKey[]; message: string } | undefined): string {
  if (!issue) return "Fichier invalide";
  const where = issue.path.length > 0 ? issue.path.map(String).join(".") : "racine";
  return `${where} : ${issue.message}`;
}

function firstDuplicate(ids: string[]): string | null {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) return id;
    seen.add(id);
  }
  return null;
}

/** Vérifications que le schéma seul ne fait pas : doublons, bonne réponse existante, trou dans la phrase. */
export function checkPackIntegrity(p: ResourcePack): string | null {
  const groups: [string, string[]][] = [
    ["vocabulary", p.vocabulary.map((x) => x.id)],
    ["grammar", p.grammar.map((x) => x.id)],
    ["videos", p.videos.map((x) => x.id)],
    ["readings", p.readings.map((x) => x.id)],
    ["pronunciation", p.pronunciation.map((x) => x.id)],
  ];
  for (const [name, ids] of groups) {
    const dup = firstDuplicate(ids);
    if (dup) return `Identifiant en double dans « ${name} » : ${dup}`;
  }
  for (const g of p.grammar) {
    for (const [i, ex] of g.exercises.entries()) {
      if (ex.type === "choice" && ex.answer >= ex.options.length) {
        return `Grammaire « ${g.id} », exercice ${i + 1} : la bonne réponse n'existe pas dans les options`;
      }
      if (ex.type === "fill" && !ex.prompt.includes("___")) {
        return `Grammaire « ${g.id} », exercice ${i + 1} : la phrase doit contenir ___ à l'endroit du trou`;
      }
    }
  }
  return null;
}

export function parsePack(text: string): ParseResult<ResourcePack> {
  if (text.length > MAX_PACK_CHARS) return { ok: false, error: "Fichier trop volumineux (20 Mo maximum)" };
  let data: unknown;
  try {
    data = JSON.parse(stripFences(text));
  } catch {
    return { ok: false, error: "Ce n'est pas un JSON valide" };
  }
  const parsed = packSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: describeIssue(parsed.error.issues[0]) };
  const p = parsed.data;
  const problem = checkPackIntegrity(p);
  if (problem) return { ok: false, error: problem };
  if (p.vocabulary.length + p.grammar.length + p.videos.length + p.readings.length + p.pronunciation.length === 0) {
    return { ok: false, error: "Le pack est vide : il ne contient ni vocabulaire, ni grammaire, ni vidéo, ni lecture" };
  }
  return { ok: true, value: p };
}

export interface PackStats {
  vocabulary: number;
  grammar: number;
  videos: number;
  transcripts: number; // vidéos qui ont une transcription
  readings: number;
  pronunciation: number;
  vocabularyByLevel: Record<Level, number>;
}

export function packStats(p: ResourcePack): PackStats {
  const byLevel = Object.fromEntries(LEVELS.map((l) => [l, 0])) as Record<Level, number>;
  for (const v of p.vocabulary) byLevel[v.level]++;
  return {
    vocabulary: p.vocabulary.length,
    grammar: p.grammar.length,
    videos: p.videos.length,
    transcripts: p.videos.filter((v) => v.transcript && v.transcript.length > 0).length,
    readings: p.readings.length,
    pronunciation: p.pronunciation.length,
    vocabularyByLevel: byLevel,
  };
}

/** Les transcriptions sont lourdes et appartiennent aux créateurs : on peut les retirer d'un export à partager. */
export function exportPack(p: ResourcePack, includeTranscripts: boolean): ResourcePack {
  if (includeTranscripts) return p;
  return { ...p, videos: p.videos.map((v) => ({ ...v, transcript: undefined })) };
}

/** Lecture tolérante des réglages enregistrés : des données corrompues donnent « pas de réglages ». */
export function readSettings(raw: string | null): LearnSettings | null {
  if (!raw) return null;
  try {
    const parsed = settingsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}