// Proposition de services à une entreprise, par modèle : 100 % local, sans IA.
// Ne s'appuie que sur les données réelles de la fiche et sur tes services : rien n'est inventé.
import type { Profile, Service } from "../types/profile";
import type { NormalizedResult } from "../types/results";
import type { Language, Tone } from "./cover-letter";
import { hostOf } from "./normalize-results";

export const FEW_REVIEWS_BELOW = 20;

export interface Observation {
  key: "praise" | "noWebsite" | "directoryOnly" | "fewReviews";
  fr: string;
  en: string;
}

/** Renvoie la raison pour laquelle on ne propose rien à cette fiche, ou null si c'est possible. */
export function pitchBlocker(r: NormalizedResult): string | null {
  if (r.kind === "job" || r.kind === "profile" || r.kind === "video") {
    return "La proposition de services est prévue pour les entreprises (fiches Google Maps ou sites web), pas pour les offres d'emploi, les profils de personnes ou les vidéos.";
  }
  if (r.raw.permanentlyClosed === true) return "Cet établissement est indiqué comme fermé définitivement.";
  return null;
}

/**
 * Ce que les données de la fiche montrent réellement. Une absence de site web n'est affirmée
 * que pour une fiche Google Maps (là où le champ « site » existe vraiment).
 */
export function observeCompany(r: NormalizedResult): Observation[] {
  const out: Observation[] = [];
  const { rating, reviewsCount: reviews } = r;

  if (rating !== null && reviews !== null && rating >= 4.3 && reviews >= 30) {
    out.push({
      key: "praise",
      fr: `vos clients vous notent très bien (${rating.toFixed(1).replace(".", ",")}/5 pour ${reviews} avis)`,
      en: `your customers rate you very highly (${rating.toFixed(1)}/5 from ${reviews} reviews)`,
    });
  }

  if (r.kind === "place") {
    if (r.website === null) {
      out.push({
        key: "noWebsite",
        fr: "votre fiche Google Maps ne renvoie vers aucun site web",
        en: "your Google Maps listing doesn't link to any website",
      });
    } else if (r.websiteIsDirectory) {
      const host = hostOf(r.website) ?? "un annuaire";
      out.push({
        key: "directoryOnly",
        fr: `le lien de votre fiche mène vers ${host} et non vers un site web à vous`,
        en: `your listing links to ${host} rather than to a website of your own`,
      });
    }
    if (reviews !== null && reviews < FEW_REVIEWS_BELOW) {
      out.push({
        key: "fewReviews",
        fr: reviews === 0 ? "votre fiche ne compte encore aucun avis" : `votre fiche ne compte que ${reviews} avis`,
        en: reviews === 0 ? "your listing has no reviews yet" : `your listing has only ${reviews} reviews`,
      });
    }
  }
  return out;
}

export interface PitchOptions {
  language: Language;
  tone: Tone;
  includeObservations: boolean;
  includePortfolio: boolean;
}

export function defaultPitchSubject(company: string | null, language: Language): string {
  const c = company?.trim();
  if (language === "fr") return c ? `Proposition de services pour ${c}` : "Proposition de services";
  return c ? `Services proposal for ${c}` : "Services proposal";
}

export function generatePitchBody(
  profile: Profile,
  company: string | null,
  services: Service[],
  observations: Observation[],
  o: PitchOptions
): string {
  const fr = o.language === "fr";
  const formal = o.tone === "formal";
  const name = profile.fullName.trim();
  const headline = profile.headline.trim();
  const target = company?.trim() || null;

  const greeting = target
    ? fr ? `Bonjour l'équipe de ${target},` : `Hello ${target} team,`
    : fr ? "Bonjour," : "Hello,";

  const intro =
    name && headline
      ? fr ? `Je m'appelle ${name} (${headline}).` : `My name is ${name} (${headline}).`
      : name
        ? fr ? `Je m'appelle ${name}.` : `My name is ${name}.`
        : headline
          ? fr ? `Je vous contacte pour mon activité : ${headline}.` : `I am contacting you about my work: ${headline}.`
          : null;

  const seen = o.includeObservations ? observations : [];
  const observationsPara =
    seen.length === 0
      ? null
      : [
          fr
            ? target ? `En consultant la fiche de ${target} en ligne, j'ai remarqué :` : "En consultant votre fiche en ligne, j'ai remarqué :"
            : target ? `While looking at ${target}'s online listing, I noticed:` : "While looking at your online listing, I noticed:",
          ...seen.map((x) => `• ${fr ? x.fr : x.en}`),
        ].join("\n");

  const colon = fr ? " : " : ": ";
  const offered = services.filter((s) => s.name.trim() !== "").slice(0, 4);
  const servicesPara =
    offered.length === 0
      ? null
      : [
          fr ? "Voici ce que je peux vous proposer :" : "Here is what I can offer you:",
          ...offered.map((s) => (s.description.trim() ? `• ${s.name.trim()}${colon}${s.description.trim()}` : `• ${s.name.trim()}`)),
        ].join("\n");

  const callToAction = fr
    ? formal
      ? "Seriez-vous disponible pour un court échange afin de voir si cela peut vous être utile ?"
      : "Si cela vous parle, échangeons quelques minutes pour voir ce qui aurait du sens pour vous."
    : formal
      ? "Would you be available for a short conversation to see whether this could be useful to you?"
      : "If this sounds interesting, let's talk for a few minutes to see what would make sense for you.";

  const site = profile.website.trim();
  const portfolio = o.includePortfolio && site ? (fr ? `Quelques réalisations : ${site}` : `Some of my work: ${site}`) : null;

  const optOut = fr
    ? "Si ce message ne vous concerne pas, répondez simplement « non merci » et je ne vous écrirai plus."
    : "If this isn't relevant to you, just reply \"no thanks\" and I won't contact you again.";

  const signature = `${fr ? "Cordialement," : "Best regards,"}${name ? `\n${name}` : ""}`;

  return [greeting, intro, observationsPara, servicesPara, callToAction, portfolio, optOut, signature]
    .filter((b): b is string => !!b)
    .join("\n\n");
}