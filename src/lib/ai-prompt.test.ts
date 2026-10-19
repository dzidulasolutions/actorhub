import { describe, expect, it } from "vitest";
import { EMPTY_PROFILE } from "../types/profile";
import { jobKey, pruneNotes, readNotes } from "./job-notes";
import { normalizeResult } from "./normalize-results";
import {
  buildAnalysisPrompt, buildLetterImprovePrompt, extractLetterFromAnswer,
  MAX_PROMPT_CV, MAX_PROMPT_OFFER, redactPersonalData, restorePlaceholders,
} from "./ai-prompt";


const profile = {
  ...EMPTY_PROFILE,
  fullName: "Joel Gamatho",
  headline: "Développeur full-stack",
  email: "joel@exemple.tg",
  phone: "+228 90 00 00 00",
  skills: ["React", "Node.js"],
  targetRoles: ["Développeur web"],
  cvText: "Joel Gamatho — joel@exemple.tg — +228 90 00 00 00\nlinkedin.com/in/joel-gamatho\n2018 - 2022 : Développeur chez Acme\n01.2018 - 06.2020 : Stage\nGamatho a livré 12 projets.",
};

const job = normalizeResult(
  {
    id: "3692563200",
    title: "Web Developer",
    companyName: "Acme",
    location: "Lomé",
    employmentType: "Contract",
    descriptionText: "Build products with React.",
    descriptionHtml: "<p>SECRET-HTML</p>",
  },
  0
);

describe("redactPersonalData", () => {
  it("masque email, téléphone, lien LinkedIn et nom, mais pas les dates", () => {
    const out = redactPersonalData(profile.cvText, profile);
    expect(out).not.toContain("joel@exemple.tg");
    expect(out).not.toContain("90 00 00 00");
    expect(out).not.toContain("linkedin.com/in");
    expect(out).not.toMatch(/Gamatho|Joel/);
    expect(out).toContain("[email]");
    expect(out).toContain("[téléphone]");
    expect(out).toContain("[profil LinkedIn]");
    expect(out).toContain("2018 - 2022"); // plage de dates conservée
    expect(out).toContain("01.2018 - 06.2020");
  });

  it("ne touche pas aux mots qui ne font que contenir un prénom", () => {
    expect(redactPersonalData("Joelle et Joel", profile)).toBe("Joelle et [Nom]");
  });
});

describe("buildAnalysisPrompt", () => {
  it("assemble règles, profil, CV masqué et offre", () => {
    const { text, cvTruncated, offerTruncated } = buildAnalysisPrompt(profile, job, { language: "fr", redact: true });
    expect(text).toContain("N'invente aucune expérience");
    expect(text).toContain("Réponds en français");
    expect(text).toContain("Compétences : React, Node.js");
    expect(text).toContain("Poste : Web Developer");
    expect(text).toContain("Entreprise : Acme");
    expect(text).toContain("Contrat : Contract");
    expect(text).toContain("Build products with React.");
    expect(text).not.toContain("SECRET-HTML"); // jamais le HTML de l'offre
    expect(text).not.toContain("joel@exemple.tg");
    expect(text).not.toContain("Gamatho");
    expect(cvTruncated).toBe(false);
    expect(offerTruncated).toBe(false);
  });

  it("garde les coordonnées du CV si le masquage est désactivé, et demande l'anglais si choisi", () => {
    const { text } = buildAnalysisPrompt(profile, job, { language: "en", redact: false });
    expect(text).toContain("joel@exemple.tg");
    expect(text).toContain("answer in English");
  });

  it("tronque un CV ou une offre trop longs et le signale", () => {
    const big = { ...profile, cvText: "x".repeat(MAX_PROMPT_CV + 500) };
    const longJob = normalizeResult({ title: "Dev", companyName: "Acme", descriptionText: "y".repeat(MAX_PROMPT_OFFER + 500) }, 0);
    const r = buildAnalysisPrompt(big, longJob, { language: "fr", redact: false });
    expect(r.cvTruncated).toBe(true);
    expect(r.offerTruncated).toBe(true);
    expect(r.text).toContain("début du CV seulement");
  });

  it("signale un CV absent sans planter", () => {
    const { text } = buildAnalysisPrompt(EMPTY_PROFILE, job, { language: "fr", redact: true });
    expect(text).toContain("(CV non renseigné)");
    expect(text).toContain("(non renseigné)");
  });
});

describe("jobKey, readNotes, pruneNotes", () => {
  it("donne une clé stable à une offre", () => {
    expect(jobKey(job)).toBe("job:id:3692563200");
    const noId = normalizeResult({ title: "Dev", companyName: "Acme", link: "https://x.com/job/1", descriptionText: "z" }, 0);
    expect(jobKey(noId)).toBe("job:url:https://x.com/job/1");
  });

  it("lit les notes de façon tolérante", () => {
    expect(readNotes(null)).toEqual({});
    expect(readNotes("pas du json")).toEqual({});
    expect(readNotes(JSON.stringify([1, 2]))).toEqual({});
    const ok = readNotes(JSON.stringify({ a: { text: "ok", updatedAt: "2026-01-01" }, b: { text: 42 } }));
    expect(Object.keys(ok)).toEqual(["a"]);
  });

  it("ne garde que les notes les plus récentes", () => {
    const notes = {
      vieille: { text: "1", updatedAt: "2026-01-01" },
      recente: { text: "2", updatedAt: "2026-03-01" },
      milieu: { text: "3", updatedAt: "2026-02-01" },
    };
    expect(Object.keys(pruneNotes(notes, 2)).sort()).toEqual(["milieu", "recente"]);
  });
});

describe("redactPersonalData (noms)", () => {
  it("remplace un nom complet par un seul repère", () => {
    expect(redactPersonalData("Cordialement,\nJoel Gamatho", profile)).toBe("Cordialement,\n[Nom]");
  });
});

describe("lettre améliorée", () => {
  const jobInfo = { title: "Web Developer", company: "Acme", description: "Build products with React." };
  const letter = "Madame, Monsieur,\n\nTexte de la lettre.\n\nCordialement,\nJoel Gamatho";

  it("construit la consigne avec les règles et masque les coordonnées", () => {
    const { text } = buildLetterImprovePrompt(profile, jobInfo, letter, { language: "fr", redact: true });
    expect(text).toContain("N'invente aucune expérience");
    expect(text).toContain("Laisse tels quels les éléments entre crochets");
    expect(text).toContain("Build products with React.");
    expect(text).toContain("Cordialement,\n[Nom]");
    expect(text).not.toContain("Gamatho");
    expect(text).not.toContain("joel@exemple.tg");
  });

  it("demande de rester en anglais pour une lettre anglaise", () => {
    const { text } = buildLetterImprovePrompt(profile, jobInfo, letter, { language: "en", redact: false });
    expect(text).toContain("anglais");
    expect(text).toContain("Joel Gamatho");
  });

  it("extrait la lettre et ignore la liste des changements", () => {
    const answer = "Madame, Monsieur,\n\nTexte.\n\nCordialement,\n[Nom]\n---\n- Phrase d'accroche reformulée\n- Ton plus direct";
    expect(extractLetterFromAnswer(answer)).toBe("Madame, Monsieur,\n\nTexte.\n\nCordialement,\n[Nom]");
    expect(extractLetterFromAnswer("  Juste la lettre.  ")).toBe("Juste la lettre.");
    expect(extractLetterFromAnswer("```\nLettre\n```\n---\n- note")).toBe("Lettre");
  });

  it("remet le nom, l'email et le téléphone, et laisse les repères sans valeur", () => {
    expect(restorePlaceholders("[Nom]\n[email] · [téléphone]", profile)).toBe("Joel Gamatho\njoel@exemple.tg · +228 90 00 00 00");
    expect(restorePlaceholders("[Nom] [profil LinkedIn]", EMPTY_PROFILE)).toBe("[Nom] [profil LinkedIn]");
  });
});