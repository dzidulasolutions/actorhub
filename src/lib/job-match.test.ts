import { describe, expect, it } from "vitest";
import { EMPTY_PROFILE } from "../types/profile";
import { createJobScorer, matchLevel } from "./job-match";
import { normalizeResult } from "./normalize-results";

const profile = {
  ...EMPTY_PROFILE,
  skills: ["React", "Node.js", "NestJS", "Flutter"],
  targetRoles: ["Développeur web"],
  targetLocations: ["Lomé", "Remote"],
};

const job = (extra: Record<string, unknown>) =>
  normalizeResult({ companyName: "Acme", descriptionText: "", ...extra }, 0);

describe("createJobScorer", () => {
  it("donne un score élevé à une offre qui colle au profil", () => {
    const r = job({
      title: "Web Developer",
      descriptionText: "We build products with React and NodeJS, plus NestJS APIs. Remote friendly.",
      location: "Lomé, Togo",
    });
    const m = createJobScorer(profile)(r)!;
    expect(m.matchedSkills).toEqual(["React", "Node.js", "NestJS"]); // « NodeJS » reconnu comme Node.js
    expect(m.roleRatio).toBe(1); // « Développeur web » ≈ « Web Developer »
    expect(m.locationMatch).toBe(true);
    expect(m.score).toBe(85);
    expect(m.level).toBe("fort");
  });

  it("donne un score nul à une offre sans rapport", () => {
    const r = job({
      title: "Retail Pharmacist",
      descriptionText: "Dispense medication in a pharmacy",
      location: "Los Angeles",
    });
    const m = createJobScorer(profile)(r)!;
    expect(m.score).toBe(0);
    expect(m.level).toBe("faible");
  });

  it("ne confond pas les compétences proches (C, C++, C#, JS dans node.js)", () => {
    const only = (skill: string, text: string) =>
      createJobScorer({ ...EMPTY_PROFILE, skills: [skill] })(job({ title: "Dev", descriptionText: text }))!.score;
    expect(only("C++", "We write C++ daily")).toBe(100);
    expect(only("C", "C# developer wanted")).toBe(0);
    expect(only("JavaScript", "Node.js backend")).toBe(0); // « js » dans « node.js » ne compte pas
    expect(only("JavaScript", "JS and CSS")).toBe(100);
  });

  it("reconnaît le télétravail pour un lieu « Remote »", () => {
    const p = { ...EMPTY_PROFILE, targetLocations: ["Remote"] };
    const r = job({ title: "Dev", descriptionText: "Poste en télétravail", location: "Paris" });
    expect(createJobScorer(p)(r)!.locationMatch).toBe(true);
  });

  it("renvoie null pour une fiche qui n'est pas une offre ou pour un profil sans critères", () => {
    const place = normalizeResult({ title: "Hôtel", placeId: "x", totalScore: 4 }, 0);
    expect(createJobScorer(profile)(place)).toBeNull();
    expect(createJobScorer(EMPTY_PROFILE)(job({ title: "Dev" }))).toBeNull();
  });
});

describe("matchLevel", () => {
  it("découpe les niveaux à 40 et 70", () => {
    expect(matchLevel(70)).toBe("fort");
    expect(matchLevel(69)).toBe("moyen");
    expect(matchLevel(40)).toBe("moyen");
    expect(matchLevel(39)).toBe("faible");
  });
});