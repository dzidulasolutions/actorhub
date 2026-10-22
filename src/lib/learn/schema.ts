// Modèle de données de la section « Apprendre » : pack de ressources, réglages, programme.
import { z } from "zod";

export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export const SKILLS = ["shadowing", "listening", "pronunciation", "grammar", "reading", "vocabulary", "speaking"] as const;
export const SLOTS = ["morning", "noon", "evening"] as const;

export type Level = (typeof LEVELS)[number];
export type Skill = (typeof SKILLS)[number];
export type Slot = (typeof SLOTS)[number];

export const SKILL_LABELS: Record<Skill, string> = {
  shadowing: "Shadowing",
  listening: "Écoute",
  pronunciation: "Prononciation",
  grammar: "Grammaire",
  reading: "Lecture",
  vocabulary: "Vocabulaire",
  speaking: "Expression orale",
};
export const SLOT_LABELS: Record<Slot, string> = { morning: "Matin", noon: "Midi", evening: "Soir" };

export const levelIndex = (l: Level) => LEVELS.indexOf(l);

// ---------- Dates (locales, sans fuseau) ----------
export function toIsoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** « 2026-02-31 » est refusée : la date doit exister vraiment. */
export function isValidIsoDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d;
}

/** Une chaîne YouTube : @nom ou un lien youtube.com (jamais un autre site). */
export const isChannelRef = (s: string) =>
  /^@[\w.-]{2,60}$/.test(s) || /^https?:\/\/(www\.|m\.)?youtube\.com\/\S+$/i.test(s);

// ---------- Briques ----------
const short = (max: number) => z.string().trim().max(max);
const req = (max: number) => z.string().trim().min(1).max(max);
// Identifiants sûrs : ils serviront de clés et dans des liens
const idSchema = z.string().trim().regex(/^[A-Za-z0-9_.:-]{1,80}$/, "identifiant invalide (lettres, chiffres, _ . : - seulement)");
const levelSchema = z.enum(LEVELS);

// ---------- Exercices ----------
export const exerciseSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("choice"), // question à choix multiple
    question: req(300),
    options: z.array(req(150)).min(2).max(6),
    answer: z.number().int().min(0), // position de la bonne réponse (0 = la première)
    explanation: short(400).optional(),
  }),
  z.object({
    type: z.literal("fill"), // phrase à trou : le trou est marqué par ___
    prompt: req(300),
    answer: req(100),
    alternatives: z.array(req(100)).max(5).default([]),
    explanation: short(400).optional(),
  }),
]);

// ---------- Pack de ressources ----------
export const vocabSchema = z.object({
  id: idSchema,
  word: req(80),
  pos: short(20).optional(), // nature : noun, verb, adjective…
  level: levelSchema,
  meaningFr: short(200).optional(),
  definition: short(300).optional(),
  example: short(300).optional(),
  themes: z.array(req(40)).max(10).default([]),
  videoId: idSchema.optional(), // vidéo d'où vient le mot
});

export const grammarSchema = z.object({
  id: idSchema,
  level: levelSchema,
  title: req(120),
  summaryFr: req(1500),
  rules: z.array(req(300)).max(15).default([]),
  examples: z.array(req(250)).max(20).default([]),
  exercises: z.array(exerciseSchema).max(30).default([]),
});

export const segmentSchema = z.object({
  start: z.number().min(0), // secondes
  duration: z.number().min(0).optional(),
  text: short(600),
});

export const videoSchema = z.object({
  // Identifiant YouTube : 11 caractères exactement (il servira à construire le lecteur intégré)
  id: z.string().regex(/^[A-Za-z0-9_-]{11}$/, "identifiant YouTube invalide (11 caractères)"),
  title: req(200),
  channel: short(100).optional(),
  publishedAt: short(40).optional(),
  durationSec: z.number().int().min(0).max(86_400).optional(),
  level: levelSchema.optional(),
  wordsPerMinute: z.number().min(0).max(400).optional(),
  themes: z.array(req(40)).max(10).default([]),
  transcript: z.array(segmentSchema).max(5000).optional(),
});

export const readingSchema = z.object({
  id: idSchema,
  title: req(150),
  level: levelSchema,
  theme: short(40).optional(),
  text: req(8000),
  source: short(200).optional(),
});

export const pronunciationSchema = z.object({
  id: idSchema,
  title: req(150),
  level: levelSchema.optional(),
  tipFr: req(800),
  examples: z.array(req(150)).max(30).default([]),
});

export const packSchema = z.object({
  version: z.literal(1),
  language: z.string().regex(/^[a-z]{2}$/, "code de langue à 2 lettres").default("en"),
  name: req(100),
  createdAt: short(40).optional(),
  vocabulary: z.array(vocabSchema).max(5000).default([]),
  grammar: z.array(grammarSchema).max(300).default([]),
  videos: z.array(videoSchema).max(500).default([]),
  readings: z.array(readingSchema).max(300).default([]),
  pronunciation: z.array(pronunciationSchema).max(200).default([]),
});

export type Exercise = z.infer<typeof exerciseSchema>;
export type ResourcePack = z.infer<typeof packSchema>;

// ---------- Réglages du programme ----------
export const settingsSchema = z
  .object({
    language: z.string().regex(/^[a-z]{2}$/),
    level: levelSchema,
    targetLevel: levelSchema,
    days: z.union([z.literal(30), z.literal(60), z.literal(90)]),
    minutesPerDay: z.number().int().min(10, "10 minutes minimum").max(240, "240 minutes maximum"),
    startDate: z.string().refine(isValidIsoDate, "date invalide (format AAAA-MM-JJ)"),
    restDays: z.array(z.number().int().min(0).max(6)).max(6, "garde au moins un jour d'étude par semaine"), // 0 = dimanche
    slots: z.array(z.enum(SLOTS)).min(1, "choisis au moins un créneau").max(3),
    skills: z.array(z.enum(SKILLS)).min(1, "choisis au moins une compétence").max(7),
    themes: z.array(req(40)).max(20),
    channels: z.array(req(200).refine(isChannelRef, "chaîne invalide : utilise @nom ou un lien youtube.com")).max(20),
  })
  .refine((s) => levelIndex(s.targetLevel) >= levelIndex(s.level), {
    message: "le niveau visé doit être au moins égal au niveau actuel",
    path: ["targetLevel"],
  });

export type LearnSettings = z.infer<typeof settingsSchema>;

export function defaultSettings(today: Date): LearnSettings {
  return {
    language: "en",
    level: "A2",
    targetLevel: "B1",
    days: 30,
    minutesPerDay: 60,
    startDate: toIsoDate(today),
    restDays: [],
    slots: [...SLOTS],
    skills: [...SKILLS],
    themes: ["travel"],
    channels: [],
  };
}

// ---------- Programme (généré à l'étape suivante, format fixé dès maintenant) ----------
export const activitySchema = z.object({
  id: idSchema,
  slot: z.enum(SLOTS),
  skill: z.enum(SKILLS),
  minutes: z.number().int().min(1).max(240),
  videoId: idSchema.optional(),
  vocabIds: z.array(idSchema).max(40).default([]),
  grammarId: idSchema.optional(),
  readingId: idSchema.optional(),
  pronunciationId: idSchema.optional(),
  topic: short(120).optional(),
});

export const daySchema = z.object({
  day: z.number().int().min(1).max(90),
  date: z.string().refine(isValidIsoDate, "date invalide"),
  theme: short(40).nullable(),
  rest: z.boolean(),
  activities: z.array(activitySchema).max(20),
});

export const programSchema = z.object({
  version: z.literal(1),
  id: idSchema,
  createdAt: short(40),
  packIds: z.array(idSchema).max(20).default([]),
  settings: settingsSchema,
  days: z.array(daySchema).min(1).max(90),
});

export type Program = z.infer<typeof programSchema>;