import { describe, expect, it } from "vitest";
import { EMPTY_PROFILE } from "../types/profile";
import {
  buildLetterHeader, defaultSubject, detectOfferLanguage, emailText, generateLetterBody,
  gmailLink, mailtoLink, shorten, type LetterOptions,
} from "./cover-letter";

const profile = {
  ...EMPTY_PROFILE,
  fullName: "Gamatho",
  headline: "Développeur full-stack",
  email: "moi@exemple.tg",
  phone: "+228 90 00 00 00",
  location: "Lomé, Togo",
  summary: "Passionné par le web.",
  skills: ["React", "Node.js", "NestJS", "Flutter", "Java", "Spring Boot"],
};
const job = { title: "Développeur web", company: "Acme", recruiterName: "Andrea Cowan" };
const base: LetterOptions = { language: "fr", tone: "formal", addressRecruiter: false, mentionCv: true };

describe("generateLetterBody", () => {
  it("français formel avec les compétences de l'offre", () => {
    const body = generateLetterBody(profile, job, ["React", "Node.js"], base);
    expect(body).toContain("Madame, Monsieur,");
    expect(body).toContain("ma candidature au poste de Développeur web au sein de Acme.");
    expect(body).toContain("notamment React et Node.js.");
    expect(body).toContain("Pour me présenter en quelques mots : Passionné par le web.");
    expect(body).toContain("Rejoindre Acme représenterait");
    expect(body).toContain("Vous trouverez mon CV ci-joint.");
    expect(body.endsWith("l'expression de mes salutations distinguées.\nGamatho")).toBe(true);
    expect(body).not.toMatch(/undefined|null/);
  });

  it("anglais cordial", () => {
    const body = generateLetterBody(profile, job, ["React"], { ...base, language: "en", tone: "friendly" });
    expect(body).toContain("Dear Hiring Team,");
    expect(body).toContain("I am writing to apply for the Développeur web position at Acme.");
    expect(body).toContain("I would love to bring my energy and skills to Acme.");
    expect(body).toContain("My CV is attached to this message.");
    expect(body.endsWith("Best regards,\nGamatho")).toBe(true);
  });

  it("s'adresse au recruteur par son prénom", () => {
    const body = generateLetterBody(profile, job, [], { ...base, addressRecruiter: true });
    expect(body).toContain("Bonjour Andrea,");
    expect(body).not.toContain("Madame, Monsieur");
    expect(body.endsWith("Cordialement,\nGamatho")).toBe(true);
  });

  it("n'évoque pas le CV si l'option est décochée", () => {
    expect(generateLetterBody(profile, job, [], { ...base, mentionCv: false })).not.toContain("CV");
  });

  it("prend les 5 premières compétences du profil quand aucune ne correspond à l'offre", () => {
    const body = generateLetterBody(profile, job, [], base);
    expect(body).toContain("j'ai développé des compétences en React, Node.js, NestJS, Flutter et Java.");
    expect(body).not.toContain("Spring Boot");
  });

  it("n'invente rien quand des informations manquent", () => {
    const body = generateLetterBody(
      { ...EMPTY_PROFILE, fullName: "Gamatho" },
      { title: "Dev", company: null, recruiterName: null },
      [],
      base
    );
    expect(body).toContain("Rejoindre votre équipe");
    expect(body).not.toContain("au sein de");
    expect(body).not.toContain("Mon parcours en tant que");
    expect(body).not.toContain("Pour me présenter");
    expect(body).not.toContain("compétences");
  });
});

describe("detectOfferLanguage", () => {
  it("reconnaît l'anglais et le français, français par défaut", () => {
    expect(detectOfferLanguage("We are looking for a developer to join our team and work with you")).toBe("en");
    expect(detectOfferLanguage("Nous recherchons un développeur pour rejoindre notre équipe")).toBe("fr");
    expect(detectOfferLanguage("")).toBe("fr");
  });
});

describe("shorten", () => {
  it("coupe à la fin d'une phrase", () => {
    const long = "Première phrase complète. ".repeat(40);
    const s = shorten(long, 100);
    expect(s.endsWith(".")).toBe(true);
    expect(s.length).toBeLessThanOrEqual(100);
    expect(shorten("court", 100)).toBe("court");
  });
});

describe("en-tête, email et liens", () => {
  const date = new Date(2026, 9, 17, 12);

  it("en-tête français", () => {
    const h = buildLetterHeader(profile, job, "fr", date, "Candidature au poste de Développeur web");
    expect(h).toContain("Gamatho\nDéveloppeur full-stack\nmoi@exemple.tg · +228 90 00 00 00\nLomé, Togo");
    expect(h).toContain("Acme");
    expect(h).toContain("Lomé, le 17 octobre 2026");
    expect(h).toContain("Objet : Candidature au poste de Développeur web");
  });

  it("en-tête anglais", () => {
    const h = buildLetterHeader(profile, job, "en", date, defaultSubject(job, "en"));
    expect(h).toContain("Lomé, October 17, 2026");
    expect(h).toContain("Subject: Application for the Développeur web position");
  });

  it("ajoute les coordonnées sous la signature d'un email", () => {
    expect(emailText("Corps\nGamatho", profile)).toBe("Corps\nGamatho\nmoi@exemple.tg · +228 90 00 00 00");
    expect(emailText("Corps", EMPTY_PROFILE)).toBe("Corps");
  });

  it("encode correctement les liens", () => {
    expect(mailtoLink("a@b.tg", "Objet é", "Ligne 1\nLigne 2")).toBe(
      "mailto:a@b.tg?subject=Objet%20%C3%A9&body=Ligne%201%0ALigne%202"
    );
    expect(gmailLink("a@b.tg", "Objet", "Corps")).toBe(
      "https://mail.google.com/mail/?view=cm&fs=1&to=a%40b.tg&su=Objet&body=Corps"
    );
    expect(gmailLink("", "Objet", "Corps")).not.toContain("to=");
  });
});