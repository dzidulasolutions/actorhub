// Lettre de motivation par modèle : 100 % local, sans IA.
// N'utilise QUE ce qui figure dans le profil et dans l'offre : rien n'est inventé.
import type { Profile } from "../types/profile";

export type Language = "fr" | "en";
export type Tone = "formal" | "friendly";

export interface LetterJob {
  title: string | null;
  company: string | null;
  recruiterName: string | null;
}

export interface LetterOptions {
  language: Language;
  tone: Tone;
  addressRecruiter: boolean; // « Bonjour Prénom, » au lieu de « Madame, Monsieur, »
  mentionCv: boolean; // phrase « Vous trouverez mon CV ci-joint. »
}

// ---------- Détection de la langue de l'offre ----------
const FR_WORDS = new Set(["le", "la", "les", "des", "du", "et", "pour", "vous", "nous", "avec", "dans", "une", "est", "sur", "au", "aux", "ce", "votre", "notre", "poste", "vos"]);
const EN_WORDS = new Set(["the", "and", "for", "you", "we", "with", "our", "your", "are", "will", "of", "to", "in", "is", "this", "as", "be", "experience"]);

/** « fr » par défaut (et en cas d'égalité) : seule une offre nettement anglaise propose l'anglais. */
export function detectOfferLanguage(text: string): Language {
  const words = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z]+/)
    .slice(0, 400);
  let fr = 0;
  let en = 0;
  for (const w of words) {
    if (FR_WORDS.has(w)) fr++;
    if (EN_WORDS.has(w)) en++;
  }
  return en > fr ? "en" : "fr";
}

// ---------- Petits outils de texte ----------
function joinList(items: string[], language: Language): string {
  if (items.length <= 1) return items[0] ?? "";
  const last = items[items.length - 1];
  const head = items.slice(0, -1).join(", ");
  if (language === "fr") return `${head} et ${last}`;
  return items.length === 2 ? `${head} and ${last}` : `${head}, and ${last}`;
}

const firstName = (full: string) => full.trim().split(/\s+/)[0];

/** Raccourcit un texte à `max` caractères, de préférence à la fin d'une phrase. */
export function shorten(text: string, max = 600): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sentenceEnd = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  if (sentenceEnd > max * 0.5) return cut.slice(0, sentenceEnd + 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > 0 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

// ---------- Corps de la lettre ----------
export function generateLetterBody(
  profile: Profile,
  job: LetterJob,
  matchedSkills: string[], // tes compétences retrouvées dans l'offre (score local)
  o: LetterOptions
): string {
  const fr = o.language === "fr";
  const formal = o.tone === "formal";
  const title = job.title?.trim() || null;
  const company = job.company?.trim() || null;
  const recruiter = o.addressRecruiter && job.recruiterName?.trim() ? firstName(job.recruiterName) : null;
  const headline = profile.headline.trim();
  const name = profile.fullName.trim();
  const summary = profile.summary.trim();

  // Compétences : celles de l'offre en priorité, sinon les premières de ton profil
  const fromOffer = matchedSkills.length > 0;
  const skills = (fromOffer ? matchedSkills : profile.skills).slice(0, 5);
  const list = joinList(skills, o.language);

  const greeting = recruiter
    ? fr ? `Bonjour ${recruiter},` : `Dear ${recruiter},`
    : fr ? "Madame, Monsieur," : "Dear Hiring Team,";

  const position = title
    ? fr ? `au poste de ${title}` : `for the ${title} position`
    : fr ? "à ce poste" : "for this position";
  const at = company ? (fr ? ` au sein de ${company}` : ` at ${company}`) : "";
  const opening = fr
    ? `Je vous écris pour vous faire part de ma candidature ${position}${at}.${headline ? ` Mon parcours en tant que ${headline} m'a permis d'acquérir une expérience que je souhaite mettre à votre service.` : ""}`
    : `I am writing to apply ${position}${at}.${headline ? ` My professional background (${headline}) has given me experience I would be glad to put to use for your team.` : ""}`;

  const skillsPara =
    skills.length === 0
      ? null
      : fr
        ? fromOffer
          ? `Votre offre fait appel à des compétences qui font partie de mon profil, notamment ${list}.`
          : `Au fil de mon parcours, j'ai développé des compétences en ${list}.`
        : fromOffer
          ? `Your job posting calls for skills that are part of my profile, notably ${list}.`
          : `Throughout my career, I have developed skills in ${list}.`;

  const summaryPara = summary
    ? fr ? `Pour me présenter en quelques mots : ${shorten(summary)}` : `In a few words about me: ${shorten(summary)}`
    : null;

  const target = company ?? (fr ? "votre équipe" : "your team");
  const motivation = fr
    ? formal
      ? `Rejoindre ${target} représenterait pour moi l'opportunité de contribuer concrètement à vos projets tout en continuant à progresser.`
      : `Votre offre a retenu toute mon attention : j'aimerais mettre mon énergie et mes compétences au service de ${target}.`
    : formal
      ? `Joining ${target} would give me the opportunity to contribute meaningfully to your projects while continuing to grow.`
      : `Your posting immediately caught my attention, and I would love to bring my energy and skills to ${target}.`;

  const closing = fr
    ? formal
      ? `Je reste à votre disposition pour un entretien afin de vous présenter plus en détail ma candidature.${o.mentionCv ? " Vous trouverez mon CV ci-joint." : ""}`
      : `Je me tiens disponible pour échanger avec vous lors d'un entretien.${o.mentionCv ? " Mon CV est joint à ce message." : ""}`
    : formal
      ? `I remain at your disposal for an interview to present my application in more detail.${o.mentionCv ? " Please find my CV attached." : ""}`
      : `I would be glad to talk with you in an interview.${o.mentionCv ? " My CV is attached to this message." : ""}`;

  const signoff = fr
    ? formal && !recruiter ? "Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées." : "Cordialement,"
    : formal && !recruiter ? "Sincerely," : "Best regards,";
  const signature = `${signoff}${name ? `\n${name}` : ""}`;

  return [greeting, opening, skillsPara, summaryPara, motivation, closing, signature]
    .filter((b): b is string => !!b)
    .join("\n\n");
}

// ---------- Objet, en-tête (PDF) et email ----------
export function defaultSubject(job: LetterJob, language: Language): string {
  const t = job.title?.trim();
  if (language === "fr") return t ? `Candidature au poste de ${t}` : "Candidature";
  return t ? `Application for the ${t} position` : "Application";
}

export function formatLetterDate(date: Date, language: Language): string {
  return new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-US", { dateStyle: "long" }).format(date);
}

/** Bloc du haut de la lettre PDF : expéditeur, destinataire, lieu et date, objet. */
export function buildLetterHeader(
  profile: Profile,
  job: LetterJob,
  language: Language,
  date: Date,
  subject: string
): string {
  const sender = [
    profile.fullName,
    profile.headline,
    [profile.email, profile.phone].map((s) => s.trim()).filter(Boolean).join(" · "),
    profile.location,
  ]
    .map((s) => s.trim())
    .filter(Boolean)
    .join("\n");
  const city = profile.location.split(",")[0].trim();
  const when = formatLetterDate(date, language);
  const place = language === "fr" ? (city ? `${city}, le ${when}` : when) : city ? `${city}, ${when}` : when;
  const recipient = job.company?.trim() ?? "";
  const subjectLine = language === "fr" ? `Objet : ${subject}` : `Subject: ${subject}`;
  return [sender, recipient, place, subjectLine].filter(Boolean).join("\n\n");
}

/** Coordonnées ajoutées sous la signature d'un email. */
export const contactLines = (profile: Profile) =>
  [profile.email, profile.phone].map((s) => s.trim()).filter(Boolean).join(" · ");

export function emailText(body: string, profile: Profile): string {
  const contact = contactLines(profile);
  return contact ? `${body}\n${contact}` : body;
}

export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// Au-delà, certains navigateurs refusent le lien : on propose alors de copier le texte
export const MAX_LINK_CHARS = 6000;

export function mailtoLink(to: string, subject: string, body: string): string {
  return `mailto:${to.trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function gmailLink(to: string, subject: string, body: string): string {
  const params = ["view=cm", "fs=1"];
  if (to.trim()) params.push(`to=${encodeURIComponent(to.trim())}`);
  params.push(`su=${encodeURIComponent(subject)}`, `body=${encodeURIComponent(body)}`);
  return `https://mail.google.com/mail/?${params.join("&")}`;
}