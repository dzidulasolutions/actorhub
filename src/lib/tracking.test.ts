import { describe, expect, it } from "vitest";
import { EMPTY_PROFILE } from "../types/profile";
import { readSent, type SentEntry } from "./sent-log";
import {
  daysSince, entryKey, filterEntries, generateFollowUp, needsFollowUp, resolveRefs, sortEntries, summarize,
} from "./tracking";
import { jobKey } from "./job-notes";
import { normalizeResult } from "./normalize-results";

// Dates sans fuseau : lues à l'heure locale, donc stables d'une machine à l'autre
const at = (d: string) => new Date(`${d}T12:00:00`).getTime();
const now = at("2026-10-20");
const entry = (sentDay: string, extra: Partial<SentEntry> = {}): SentEntry => ({
  to: "rh@acme.com",
  subject: "Candidature au poste de Dev",
  company: "Acme",
  sentAt: `${sentDay}T12:00:00`,
  ...extra,
});

describe("relances", () => {
  it("suggère une relance après 7 jours sans réponse", () => {
    expect(needsFollowUp(entry("2026-10-10"), now)).toBe(true);
    expect(needsFollowUp(entry("2026-10-13"), now)).toBe(true); // exactement 7 jours
    expect(needsFollowUp(entry("2026-10-15"), now)).toBe(false);
  });

  it("ne suggère rien si une réponse est reçue, si c'est terminé, ou après 2 relances", () => {
    expect(needsFollowUp(entry("2026-10-01", { status: "replied" }), now)).toBe(false);
    expect(needsFollowUp(entry("2026-10-01", { status: "done" }), now)).toBe(false);
    expect(needsFollowUp(entry("2026-10-01", { followUps: 2 }), now)).toBe(false);
  });

  it("repart de la dernière relance", () => {
    expect(needsFollowUp(entry("2026-10-01", { followUps: 1, followedUpAt: "2026-10-18T12:00:00" }), now)).toBe(false);
    expect(needsFollowUp(entry("2026-10-01", { followUps: 1, followedUpAt: "2026-10-10T12:00:00" }), now)).toBe(true);
  });

  it("calcule l'ancienneté en jours", () => {
    expect(daysSince("2026-10-10T12:00:00", now)).toBe(10);
    expect(daysSince("date illisible", now)).toBe(0);
  });
});

describe("résumé, filtre et tri", () => {
  const list = [
    entry("2026-10-18"), // en attente, pas encore à relancer
    entry("2026-10-05", { to: "a@b.tg" }), // à relancer
    entry("2026-10-06", { to: "c@d.tg", status: "replied" }),
    entry("2026-10-07", { to: "e@f.tg", status: "done" }),
  ];

  it("compte par statut", () => {
    expect(summarize(list, now)).toEqual({ total: 4, waiting: 2, replied: 1, done: 1, due: 1 });
  });

  it("filtre", () => {
    expect(filterEntries(list, "due", now).map((e) => e.to)).toEqual(["a@b.tg"]);
    expect(filterEntries(list, "replied", now)).toHaveLength(1);
    expect(filterEntries(list, "all", now)).toHaveLength(4);
  });

  it("met les contacts à relancer en premier, puis les plus récents", () => {
    expect(sortEntries(list, now).map((e) => e.to)).toEqual(["a@b.tg", "rh@acme.com", "e@f.tg", "c@d.tg"]);
  });

  it("identifie une entrée par sa date et son destinataire", () => {
    expect(entryKey(entry("2026-10-10", { to: "RH@Acme.com" }))).toBe("2026-10-10T12:00:00|rh@acme.com");
  });
});

describe("generateFollowUp", () => {
  const profile = { ...EMPTY_PROFILE, fullName: "Gamatho" };

  it("relance de candidature en français", () => {
    const text = generateFollowUp(profile, entry("2026-10-10"), "fr");
    expect(text).toContain("Je me permets de revenir vers vous au sujet de ma candidature chez Acme, envoyée le 10 octobre 2026.");
    expect(text).toContain("Si le poste est déjà pourvu");
    expect(text.endsWith("Cordialement,\nGamatho")).toBe(true);
  });

  it("relance de proposition en anglais", () => {
    const text = generateFollowUp(profile, entry("2026-10-10", { purpose: "pitch" }), "en");
    expect(text).toContain("I am following up on my services proposal for Acme, sent on October 10, 2026.");
    expect(text).toContain('a simple "no thanks"');
    expect(text.endsWith("Best regards,\nGamatho")).toBe(true);
  });

  it("annonce le dernier message à la deuxième relance", () => {
    expect(generateFollowUp(profile, entry("2026-10-10", { followUps: 1 }), "fr")).toContain("dernier message");
  });

  it("n'écrit ni « undefined » ni « null » quand l'entreprise ou le nom manquent", () => {
    const text = generateFollowUp(EMPTY_PROFILE, entry("2026-10-10", { company: null }), "fr");
    expect(text).toContain("ma candidature, envoyée");
    expect(text).not.toMatch(/undefined|null/);
  });
});

describe("resolveRefs", () => {
  it("retrouve la recherche et la position d'une fiche", () => {
    const a = { id: "run1", items: [{ id: "1", title: "A", companyName: "X", descriptionText: "t" }] };
    const b = { id: "run2", items: [{ title: "Z" }, { id: "42", title: "B", companyName: "Y", descriptionText: "t" }] };
    const ref = jobKey(normalizeResult(b.items[1], 1));
    const found = resolveRefs([a, { id: "run3", items: null }, b], new Set([ref, "inconnue"]));
    expect(found.get(ref)).toEqual({ runId: "run2", index: 1 });
    expect(found.has("inconnue")).toBe(false);
    expect(resolveRefs([a], new Set()).size).toBe(0);
  });
});

describe("readSent (champs de suivi)", () => {
  it("garde le statut, la note et les relances, et ignore les valeurs invalides", () => {
    const [ok, bad] = readSent(JSON.stringify([
      { to: "a@b.tg", subject: "x", company: null, sentAt: "2026-01-01", status: "replied", note: "Rappeler lundi", followUps: 1, followedUpAt: "2026-01-09" },
      { to: "c@d.tg", subject: "y", company: null, sentAt: "2026-01-02", status: "nimporte", followUps: -3 },
    ]));
    expect(ok.status).toBe("replied");
    expect(ok.note).toBe("Rappeler lundi");
    expect(ok.followUps).toBe(1);
    expect(bad.status).toBeUndefined();
    expect(bad.followUps).toBeUndefined();
  });
});