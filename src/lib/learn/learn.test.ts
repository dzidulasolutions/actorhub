import { describe, expect, it } from "vitest";
import { exportPack, MAX_PACK_CHARS, packStats, parsePack, readSettings, stripFences } from "./pack-utils";
import { SAMPLE_PACK } from "./sample-pack";
import { defaultSettings, isChannelRef, isValidIsoDate, programSchema, settingsSchema, toIsoDate } from "./schema";

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const json = (v: unknown) => JSON.stringify(v);
const today = new Date(2026, 9, 21, 12);

describe("pack d'exemple", () => {
  it("est valide et couvre les niveaux A1 à B2", () => {
    expect(parsePack(json(SAMPLE_PACK)).ok).toBe(true);
    const s = packStats(SAMPLE_PACK);
    for (const l of ["A1", "A2", "B1", "B2"] as const) expect(s.vocabularyByLevel[l]).toBeGreaterThan(0);
    expect(s.vocabularyByLevel.C1).toBe(0);
    expect(s.grammar).toBe(2);
  });
});

describe("parsePack", () => {
  it("accepte un JSON copié avec ses balises de code", () => {
    expect(parsePack("```json\n" + json(SAMPLE_PACK) + "\n```").ok).toBe(true);
  });

  it("refuse un JSON invalide ou trop gros", () => {
    const r = parsePack("pas du json");
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toContain("JSON");
    expect(parsePack("x".repeat(MAX_PACK_CHARS + 1)).ok).toBe(false);
  });

  it("indique l'endroit exact d'une erreur", () => {
    const p = clone(SAMPLE_PACK);
    (p.vocabulary[0] as { level: string }).level = "D1";
    const r = parsePack(json(p));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toContain("vocabulary.0.level");
  });

  it("refuse les identifiants en double", () => {
    const p = clone(SAMPLE_PACK);
    p.vocabulary[1].id = p.vocabulary[0].id;
    const r = parsePack(json(p));
    expect(!r.ok && r.error).toContain("double");
  });

  it("refuse un exercice dont la bonne réponse n'existe pas ou sans trou", () => {
    const a = clone(SAMPLE_PACK);
    const choice = a.grammar[0].exercises[0];
    if (choice.type === "choice") choice.answer = 9;
    const ra = parsePack(json(a));
    expect(!ra.ok && ra.error).toContain("bonne réponse");

    const b = clone(SAMPLE_PACK);
    const fill = b.grammar[0].exercises.find((e) => e.type === "fill");
    if (fill?.type === "fill") fill.prompt = "No blank here";
    const rb = parsePack(json(b));
    expect(!rb.ok && rb.error).toContain("___");
  });

  it("refuse un pack vide ou sans version", () => {
    const empty = parsePack(json({ version: 1, name: "x" }));
    expect(!empty.ok && empty.error).toContain("vide");
    expect(parsePack(json({ name: "x" })).ok).toBe(false);
  });

  it("refuse un identifiant de vidéo qui n'a pas 11 caractères", () => {
    const p = clone(SAMPLE_PACK);
    p.videos.push({ id: "court", title: "Demo", themes: [] });
    expect(parsePack(json(p)).ok).toBe(false);
  });
});

describe("export et statistiques", () => {
  const withVideo = clone(SAMPLE_PACK);
  withVideo.videos.push({ id: "AAAAAAAAAAA", title: "Demo", themes: [], transcript: [{ start: 0, duration: 2, text: "Hello" }] });

  it("retire les transcriptions à la demande, sans toucher au reste", () => {
    expect(exportPack(withVideo, true).videos[0].transcript).toHaveLength(1);
    const stripped = exportPack(withVideo, false);
    expect(json(stripped)).not.toContain("Hello");
    expect(stripped.videos[0].title).toBe("Demo");
    expect(stripped.vocabulary).toHaveLength(21);
    expect(packStats(withVideo).transcripts).toBe(1);
  });

  it("retire les balises de code", () => {
    expect(stripFences("```json\n{\"a\":1}\n```")).toBe('{"a":1}');
    expect(stripFences('  {"a":1}  ')).toBe('{"a":1}');
  });
});

describe("réglages", () => {
  it("les réglages par défaut sont valides", () => {
    const s = defaultSettings(today);
    expect(settingsSchema.safeParse(s).success).toBe(true);
    expect(s.startDate).toBe("2026-10-21");
    expect(toIsoDate(today)).toBe("2026-10-21");
  });

  it("refuse un niveau visé inférieur au niveau actuel", () => {
    const s = { ...defaultSettings(today), level: "B1" as const, targetLevel: "A2" as const };
    const r = settingsSchema.safeParse(s);
    expect(r.success).toBe(false);
    expect(!r.success && r.error.issues[0].path).toEqual(["targetLevel"]);
  });

  it("refuse les valeurs hors limites", () => {
    const s = defaultSettings(today);
    expect(settingsSchema.safeParse({ ...s, minutesPerDay: 5 }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...s, days: 45 }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...s, restDays: [0, 1, 2, 3, 4, 5, 6] }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...s, slots: [] }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...s, channels: ["javascript:alert(1)"] }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...s, channels: ["@BBCLearningEnglish"] }).success).toBe(true);
  });

  it("valide les dates et les chaînes", () => {
    expect(isValidIsoDate("2026-02-28")).toBe(true);
    expect(isValidIsoDate("2026-02-31")).toBe(false);
    expect(isValidIsoDate("21/10/2026")).toBe(false);
    expect(isChannelRef("https://www.youtube.com/@abc")).toBe(true);
    expect(isChannelRef("http://evil.com/youtube.com")).toBe(false);
    expect(isChannelRef("bbc")).toBe(false);
  });

  it("relit de façon tolérante", () => {
    expect(readSettings(null)).toBeNull();
    expect(readSettings("pas du json")).toBeNull();
    expect(readSettings(json({ level: "Z9" }))).toBeNull();
    expect(readSettings(json(defaultSettings(today)))?.level).toBe("A2");
  });
});

describe("format du programme", () => {
  const program = {
    version: 1,
    id: "prog-1",
    createdAt: "2026-10-21T10:00:00.000Z",
    settings: defaultSettings(today),
    days: [
      {
        day: 1,
        date: "2026-10-21",
        theme: "travel",
        rest: false,
        activities: [{ id: "d1-a1", slot: "morning", skill: "shadowing", minutes: 20, vocabIds: ["v-001"] }],
      },
    ],
  };

  it("accepte un programme valide et refuse un jour 0 ou une compétence inconnue", () => {
    expect(programSchema.safeParse(program).success).toBe(true);
    expect(programSchema.safeParse({ ...program, days: [{ ...program.days[0], day: 0 }] }).success).toBe(false);
    const bad = clone(program);
    (bad.days[0].activities[0] as { skill: string }).skill = "cooking";
    expect(programSchema.safeParse(bad).success).toBe(false);
  });
});