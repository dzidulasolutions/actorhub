import { describe, expect, it } from "vitest";
import { EMPTY_PROFILE } from "../types/profile";
import { normalizeResult } from "./normalize-results";
import { defaultPitchSubject, generatePitchBody, observeCompany, pitchBlocker, type PitchOptions } from "./pitch";

const place = (extra: Record<string, unknown> = {}) =>
  normalizeResult(
    { title: "Chez Mario", placeId: "x", categoryName: "Restaurant", address: "Rue 12, Lomé", totalScore: 4.6, reviewsCount: 191, ...extra },
    0
  );

const profile = {
  ...EMPTY_PROFILE,
  fullName: "Gamatho",
  headline: "Développeur full-stack",
  website: "https://gamatho.dev",
};
const services = [
  { name: "Site vitrine", description: "Un site clair et rapide." },
  { name: "Catalogue en ligne", description: "" },
];
const base: PitchOptions = { language: "fr", tone: "formal", includeObservations: true, includePortfolio: true };

describe("observeCompany", () => {
  it("compliment réel et absence de site sur une fiche Google Maps", () => {
    expect(observeCompany(place()).map((o) => o.key)).toEqual(["praise", "noWebsite"]);
  });

  it("repère un lien qui mène vers un annuaire", () => {
    const obs = observeCompany(place({ website: "https://www.goafricaonline.com/tg/x" }));
    expect(obs.map((o) => o.key)).toEqual(["praise", "directoryOnly"]);
    expect(obs[1].fr).toContain("goafricaonline.com");
  });

  it("signale le peu d'avis, sans compliment si la note est moyenne", () => {
    const obs = observeCompany(place({ website: "https://mario.tg", reviewsCount: 7, totalScore: 4.0 }));
    expect(obs.map((o) => o.key)).toEqual(["fewReviews"]);
    expect(observeCompany(place({ website: "https://mario.tg", reviewsCount: 0 }))[0].fr).toContain("aucun avis");
  });

  it("n'affirme rien d'une fiche qui ne vient pas de Google Maps", () => {
    const other = normalizeResult({ title: "Acme", domain: "acme.com", emails: ["a@acme.com"] }, 0);
    expect(observeCompany(other)).toEqual([]);
  });
});

describe("pitchBlocker", () => {
  it("bloque les offres, profils, vidéos et établissements fermés", () => {
    expect(pitchBlocker(normalizeResult({ title: "Dev", companyName: "Acme", descriptionText: "x" }, 0))).not.toBeNull();
    expect(pitchBlocker(normalizeResult({ firstName: "A", lastName: "B", headline: "x" }, 0))).not.toBeNull();
    expect(pitchBlocker(normalizeResult({ webVideoUrl: "https://tiktok.com/@a/video/1" }, 0))).not.toBeNull();
    expect(pitchBlocker(place({ permanentlyClosed: true }))).not.toBeNull();
    expect(pitchBlocker(place())).toBeNull();
    expect(pitchBlocker(normalizeResult({ title: "Acme", domain: "acme.com" }, 0))).toBeNull();
  });
});

describe("generatePitchBody", () => {
  it("français formel complet", () => {
    const body = generatePitchBody(profile, "Chez Mario", services, observeCompany(place()), base);
    expect(body).toContain("Bonjour l'équipe de Chez Mario,");
    expect(body).toContain("Je m'appelle Gamatho (Développeur full-stack).");
    expect(body).toContain("j'ai remarqué :");
    expect(body).toContain("• vos clients vous notent très bien (4,6/5 pour 191 avis)");
    expect(body).toContain("• votre fiche Google Maps ne renvoie vers aucun site web");
    expect(body).toContain("• Site vitrine : Un site clair et rapide.");
    expect(body).toContain("• Catalogue en ligne\n"); // sans description : pas de « : » parasite
    expect(body).not.toContain("Catalogue en ligne :");
    expect(body).toContain("Seriez-vous disponible pour un court échange");
    expect(body).toContain("Quelques réalisations : https://gamatho.dev");
    expect(body).toContain("répondez simplement « non merci »");
    expect(body.endsWith("Cordialement,\nGamatho")).toBe(true);
    expect(body).not.toMatch(/undefined|null/);
  });

  it("anglais cordial", () => {
    const body = generatePitchBody(profile, "Chez Mario", services, observeCompany(place()), { ...base, language: "en", tone: "friendly" });
    expect(body).toContain("Hello Chez Mario team,");
    expect(body).toContain("Here is what I can offer you:");
    expect(body).toContain("• Site vitrine: Un site clair et rapide.");
    expect(body).toContain("your Google Maps listing doesn't link to any website");
    expect(body).toContain("let's talk for a few minutes");
    expect(body).toContain('just reply "no thanks"');
    expect(body.endsWith("Best regards,\nGamatho")).toBe(true);
  });

  it("respecte les options et les informations manquantes", () => {
    const noObs = generatePitchBody(profile, "Chez Mario", services, observeCompany(place()), { ...base, includeObservations: false });
    expect(noObs).not.toContain("j'ai remarqué");
    const noPortfolio = generatePitchBody(profile, "Chez Mario", services, [], { ...base, includePortfolio: false });
    expect(noPortfolio).not.toContain("Quelques réalisations");

    const bare = generatePitchBody({ ...EMPTY_PROFILE, fullName: "Gamatho" }, null, [], observeCompany(place()), base);
    expect(bare.startsWith("Bonjour,")).toBe(true);
    expect(bare).toContain("votre fiche en ligne");
    expect(bare).not.toContain("Voici ce que je peux vous proposer");
  });
});

describe("defaultPitchSubject", () => {
  it("objet honnête et précis", () => {
    expect(defaultPitchSubject("Chez Mario", "fr")).toBe("Proposition de services pour Chez Mario");
    expect(defaultPitchSubject(null, "en")).toBe("Services proposal");
  });
});