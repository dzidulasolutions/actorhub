// Construit une consigne à coller dans un chat d'IA gratuit. 100 % local : rien n'est envoyé par l'app.
import type { Profile } from "../types/profile";
import type { NormalizedResult } from "../types/results";
import type { Language } from "./cover-letter";

export const MAX_PROMPT_CV = 12_000; // caractères du CV inclus dans la consigne
export const MAX_PROMPT_OFFER = 8_000; // caractères de la description de l'offre

export interface PromptOptions {
  language: Language; // langue de la réponse demandée à l'IA
  redact: boolean; // masquer nom, email, téléphone et lien LinkedIn
}

export interface PromptResult {
  text: string;
  cvTruncated: boolean;
  offerTruncated: boolean;
}

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)*\.[A-Z]{2,}/gi;
const LINKEDIN = /(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[^\s)]+/gi;
const PHONE = /(?:\+|00)?\d[\d\s().-]{7,}\d/g;
const YEAR = /\b(?:19|20)\d{2}\b/;

/**
 * Masque les coordonnées personnelles d'un texte (au mieux : à relire avant de partager).
 * Les plages de dates (« 2018 - 2022 ») ne sont pas prises pour des numéros de téléphone.
 */
export function redactPersonalData(text: string, profile: Profile): string {
  const nameParts = new Set(
    profile.fullName
      .toLowerCase()
      .split(/\s+/)
      .filter((p) => p.length >= 3)
  );
  return text
    .replace(EMAIL, "[email]")
    .replace(LINKEDIN, "[profil LinkedIn]")
    .replace(PHONE, (m) => (m.replace(/\D/g, "").length >= 8 && !YEAR.test(m) ? "[téléphone]" : m))
    // Prénoms et noms : mot par mot, sans toucher aux mots qui ne font que les contenir
    .replace(/[\p{L}\p{N}_'’-]+/gu, (w) => (nameParts.has(w.toLowerCase()) ? "[Nom]" : w))
    .replace(/\[Nom\](?:\s+\[Nom\])+/g, "[Nom]");
}

export function buildAnalysisPrompt(
  profile: Profile,
  result: NormalizedResult,
  o: PromptOptions
): PromptResult {
  const fr = o.language === "fr";
  const clean = (s: string) => (o.redact ? redactPersonalData(s, profile) : s);

  const cvFull = clean(profile.cvText.trim());
  const cvTruncated = cvFull.length > MAX_PROMPT_CV;
  const cv = cvTruncated ? cvFull.slice(0, MAX_PROMPT_CV) : cvFull;

  const offerFull = (result.description ?? "").trim();
  const offerTruncated = offerFull.length > MAX_PROMPT_OFFER;
  const offer = offerTruncated ? offerFull.slice(0, MAX_PROMPT_OFFER) : offerFull;

  const line = (label: string, value: string | null | undefined) => (value && value.trim() ? `${label} : ${value.trim()}` : null);
  const joined = (xs: string[]) => (xs.length > 0 ? xs.join(", ") : null);

  const profileBlock = [
    line("Titre", profile.headline),
    line("Compétences", joined(profile.skills)),
    line("Langues", joined(profile.languages)),
    line("Postes recherchés", joined(profile.targetRoles)),
    line("Lieux recherchés", joined(profile.targetLocations)),
    line("Présentation", clean(profile.summary)),
  ]
    .filter(Boolean)
    .join("\n");

  const offerBlock = [
    line("Poste", result.title),
    line("Entreprise", result.tagline),
    line("Lieu", result.subtitle),
    line("Secteur", result.category),
    ...result.facts.map((f) => line(f.label, f.value)),
    line("Publiée le", result.date),
  ]
    .filter(Boolean)
    .join("\n");

  const text = [
    "Tu es un conseiller en recrutement. Analyse l'adéquation entre mon profil et l'offre d'emploi ci-dessous.",
    [
      "RÈGLES STRICTES",
      "- Appuie-toi UNIQUEMENT sur les informations de mon CV et de mon profil. N'invente aucune expérience, aucun diplôme, aucune compétence.",
      "- Si une information manque pour juger un point, dis-le clairement au lieu de supposer.",
      `- ${fr ? "Réponds en français" : "Réponds en anglais (answer in English)"}, de façon concise et honnête.`,
    ].join("\n"),
    [
      "FORMAT DE LA RÉPONSE",
      "1. Score de correspondance : X/100, avec une phrase de justification.",
      "2. Points forts : les éléments de mon CV qui répondent à l'offre (cite-les).",
      "3. Points manquants ou faibles : ce que l'offre demande et que mon CV ne montre pas.",
      "4. Mots-clés de l'offre à reprendre dans mon CV et ma lettre de motivation.",
      "5. Trois conseils concrets pour adapter ma candidature.",
      "6. Faut-il postuler ? Une réponse courte et franche.",
    ].join("\n"),
    `--- MON PROFIL ---\n${profileBlock || "(non renseigné)"}`,
    `--- MON CV${cvTruncated ? " (début du CV seulement)" : ""} ---\n${cv || "(CV non renseigné)"}`,
    `--- L'OFFRE ---\n${offerBlock}${offer ? `\nDescription :\n${offer}${offerTruncated ? "\n[… description coupée]" : ""}` : ""}`,
  ].join("\n\n");

  return { text, cvTruncated, offerTruncated };
}

export const MAX_IMPROVE_CV = 8_000;
export const MAX_IMPROVE_OFFER = 4_000;

const fmtLine = (label: string, value: string | null | undefined) =>
  value && value.trim() ? `${label} : ${value.trim()}` : null;
const fmtList = (xs: string[]) => (xs.length > 0 ? xs.join(", ") : null);

/** Consigne pour améliorer une lettre de motivation existante, sans rien inventer. */
export function buildLetterImprovePrompt(
  profile: Profile,
  job: { title: string | null; company: string | null; description: string | null },
  letter: string,
  o: PromptOptions
): PromptResult {
  const fr = o.language === "fr";
  const clean = (s: string) => (o.redact ? redactPersonalData(s, profile) : s);

  const cvFull = clean(profile.cvText.trim());
  const cvTruncated = cvFull.length > MAX_IMPROVE_CV;
  const cv = cvTruncated ? cvFull.slice(0, MAX_IMPROVE_CV) : cvFull;

  const offerFull = (job.description ?? "").trim();
  const offerTruncated = offerFull.length > MAX_IMPROVE_OFFER;
  const offer = offerTruncated ? offerFull.slice(0, MAX_IMPROVE_OFFER) : offerFull;

  const profileBlock = [fmtLine("Titre", profile.headline), fmtLine("Compétences", fmtList(profile.skills))]
    .filter(Boolean)
    .join("\n");
  const offerBlock = [fmtLine("Poste", job.title), fmtLine("Entreprise", job.company)].filter(Boolean).join("\n");

  const text = [
    "Tu es un conseiller en recrutement et un excellent rédacteur. Améliore la lettre de motivation ci-dessous pour l'offre indiquée.",
    [
      "RÈGLES STRICTES",
      "- Appuie-toi UNIQUEMENT sur mon CV, mon profil et ma lettre actuelle. N'invente aucune expérience, aucun diplôme, aucun chiffre, aucune compétence.",
      `- Garde la même langue que la lettre (${fr ? "français" : "anglais"}) et une longueur proche de l'originale (une page maximum).`,
      "- Rends le texte plus naturel, plus précis et plus convaincant, en reliant mes expériences réelles aux besoins de l'offre.",
      "- Conserve la formule d'appel, la formule de politesse et la signature.",
      "- Laisse tels quels les éléments entre crochets, comme [Nom] ou [email].",
    ].join("\n"),
    [
      "FORMAT DE LA RÉPONSE",
      "- Écris d'abord UNIQUEMENT la lettre améliorée, sans introduction ni commentaire.",
      "- Puis une ligne contenant seulement ---",
      "- Puis, en trois puces au maximum, ce que tu as changé.",
    ].join("\n"),
    `--- L'OFFRE ---\n${offerBlock}${offer ? `\nDescription :\n${offer}${offerTruncated ? "\n[… description coupée]" : ""}` : ""}`,
    `--- MON PROFIL ---\n${profileBlock || "(non renseigné)"}`,
    `--- MON CV${cvTruncated ? " (début du CV seulement)" : ""} ---\n${cv || "(CV non renseigné)"}`,
    `--- MA LETTRE ACTUELLE ---\n${clean(letter.trim())}`,
  ].join("\n\n");

  return { text, cvTruncated, offerTruncated };
}

/** Ne garde de la réponse que la lettre : tout ce qui suit la ligne « --- » (liste des changements) est retiré. */
export function extractLetterFromAnswer(answer: string): string {
  const first = answer.replace(/\r\n?/g, "\n").split(/^\s*(?:-{3,}|\*{3,})\s*$/m)[0].trim();
  return first.replace(/^```[a-z]*\n/i, "").replace(/\n```$/, "").trim(); // retire un éventuel bloc de code
}

/** Remet tes coordonnées à la place des repères du masquage. Un repère sans valeur à remettre est laissé tel quel. */
export function restorePlaceholders(text: string, profile: Profile): string {
  let out = text;
  if (profile.fullName.trim()) out = out.replaceAll("[Nom]", profile.fullName.trim());
  if (profile.email.trim()) out = out.replaceAll("[email]", profile.email.trim());
  if (profile.phone.trim()) out = out.replaceAll("[téléphone]", profile.phone.trim());
  return out;
}