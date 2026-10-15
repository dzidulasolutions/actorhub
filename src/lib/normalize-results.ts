// src/lib/normalize-results.ts
import type {
  NormalizedResult,
  ResultFact,
  ResultKind,
  SocialLink,
  SocialNetwork,
} from "@/types/results";

// Noms de champs courants (relevés sur les Actors Google Maps, Contact Details, LinkedIn, TikTok),
// par ordre de priorité. Sert UNIQUEMENT à l'affichage, jamais à modifier les données.
const TITLE_KEYS = ["title", "name", "fullName", "displayName", "profileName", "username", "companyName", "headline"];
const URL_KEYS = ["url", "link", "profileUrl", "webUrl", "postUrl", "videoUrl", "webVideoUrl", "linkedinUrl"];
const WEBSITE_KEYS = ["website", "companyWebsite", "domain"];
const CATEGORY_KEYS = ["categoryName", "category", "categories", "industry", "industries"];
const RATING_KEYS = ["totalScore", "rating", "stars", "score"];
const REVIEWS_KEYS = ["reviewsCount", "reviews", "numberOfReviews", "ratingCount"];
const DESC_KEYS = ["description", "descriptionText", "text", "bio", "about", "summary", "snippet", "caption"];
const ADDRESS_KEYS = ["address", "location", "fullAddress", "street", "city"];
const DATE_KEYS = ["date", "publishedAt", "createdAt", "postedAt", "createTimeISO", "timestamp", "datePublished"];
const PHONE_KEYS = ["phone", "phones", "phoneNumber", "telephone", "mobile"];
const IMAGE_KEYS = ["imageUrl", "image", "thumbnail", "thumbnailUrl", "companyLogo", "logo", "profilePicture", "photo", "avatar", "photoUrl"];
// Images imbriquées : [objet, champ] (ex. couverture d'une vidéo TikTok)
const NESTED_IMAGE_PATHS: [string, string][] = [["videoMeta", "coverUrl"], ["authorMeta", "avatar"]];

// Hôtes qui ne sont pas le site propre d'une entreprise. Liste à compléter au fil des besoins.
const DIRECTORY_HOSTS = [
  "goafricaonline.com", "facebook.com", "instagram.com", "linkedin.com", "tiktok.com",
  "booking.com", "tripadvisor.com", "tripadvisor.fr", "yelp.com", "pagesjaunes.fr", "linktr.ee",
];

// "linkedIns", "facebooks", "instagram"… (avec ou sans "s" final)
const SOCIAL_KEY = /^(linkedin|facebook|instagram|twitter|youtube|tiktok)s?$/i;

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)*\.[A-Z]{2,}/gi;
const FAKE_TLDS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "css", "js"]); // "logo@2x.png"
const MAX_DEPTH = 5;
const MAX_NODES = 500; // garde-fou sur les objets énormes

const compactFormat = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

// Première valeur texte non vide parmi les clés candidates (insensible à la casse).
// Accepte un texte, un nombre ou un tableau (on prend alors le premier texte).
function pickString(obj: Record<string, unknown>, keys: string[]): string | null {
  const lower = new Map(Object.keys(obj).map((k) => [k.toLowerCase(), k]));
  for (const key of keys) {
    const real = lower.get(key.toLowerCase());
    if (!real) continue;
    const v = obj[real];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    if (Array.isArray(v)) {
      const first = v.find((x): x is string => typeof x === "string" && x.trim() !== "");
      if (first) return first.trim();
    }
  }
  return null;
}

function pickNumber(obj: Record<string, unknown>, keys: string[]): number | null {
  const lower = new Map(Object.keys(obj).map((k) => [k.toLowerCase(), k]));
  for (const key of keys) {
    const real = lower.get(key.toLowerCase());
    if (!real) continue;
    const v = obj[real];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  }
  return null;
}

// Un lien n'est gardé que s'il est http(s) : bloque javascript:, data:, mailto:, etc.
export function safeUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

// Site web : accepte aussi un domaine nu ("apify.com") en ajoutant https://
function normalizeWebsite(value: string | null): string | null {
  if (!value) return null;
  const v = value.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return safeUrl(v); // a déjà un protocole
  return /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(v) ? safeUrl(`https://${v}`) : null;
}

/** Nom d'hôte lisible d'une URL ("www.exemple.com" → "exemple.com"), ou null. */
export function hostOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

const isDirectoryHost = (url: string | null) => {
  const host = hostOf(url);
  return !!host && DIRECTORY_HOSTS.some((d) => host === d || host.endsWith(`.${d}`));
};

// Retire le "plus code" Google en début d'adresse (ex. "4696+38F, ")
const stripPlusCode = (s: string) => s.replace(/^[A-Z0-9]{4,8}\+[A-Z0-9]{2,3},?\s+/, "");

// Adresse : texte direct, texte prêt à l'emploi d'un objet de localisation (LinkedIn),
// ou assemblage des champs d'un objet { street, city, ... }
function pickAddress(obj: Record<string, unknown>): string | null {
  const direct = pickString(obj, ADDRESS_KEYS);
  if (direct) return stripPlusCode(direct);
  for (const key of ADDRESS_KEYS) {
    const v = obj[key];
    if (!isObject(v)) continue;
    const text =
      pickString(v, ["linkedinText", "text", "name"]) ??
      (isObject(v.parsed) ? pickString(v.parsed, ["text"]) : null);
    if (text) return text;
    const parts = ["street", "city", "state", "postalCode", "country"]
      .map((k) => v[k])
      .filter((p): p is string => typeof p === "string" && p.trim() !== "");
    if (parts.length) return parts.join(", ");
  }
  return null;
}

function pickDate(obj: Record<string, unknown>): string | null {
  const s = pickString(obj, DATE_KEYS);
  if (!s) return null;
  // Timestamp numérique (secondes ou millisecondes) → ISO ; sinon on garde le texte tel quel
  if (/^\d{10,13}$/.test(s)) {
    const d = new Date(s.length === 10 ? Number(s) * 1000 : Number(s));
    return Number.isNaN(d.getTime()) ? s : d.toISOString();
  }
  return s;
}

// Image : champs courants, puis champs imbriqués. https uniquement.
function pickImage(raw: Record<string, unknown>): string | null {
  const candidates: (string | null)[] = [pickString(raw, IMAGE_KEYS)];
  for (const [parent, field] of NESTED_IMAGE_PATHS) {
    const obj = raw[parent];
    if (isObject(obj)) candidates.push(pickString(obj, [field]));
  }
  for (const c of candidates) {
    const url = safeUrl(c);
    if (url?.startsWith("https:")) return url;
  }
  return null;
}

// Emails : parcourt TOUTE la structure (champs imbriqués, tableaux) et repère les adresses
export function extractEmails(value: unknown): string[] {
  const found = new Set<string>();
  let nodes = 0;

  const walk = (v: unknown, depth: number) => {
    if (nodes++ > MAX_NODES || depth > MAX_DEPTH) return;
    if (typeof v === "string") {
      for (const m of v.matchAll(EMAIL_RE)) {
        const tld = m[0].split(".").pop()!.toLowerCase();
        if (!FAKE_TLDS.has(tld)) found.add(m[0].toLowerCase());
      }
    } else if (Array.isArray(v)) {
      v.forEach((x) => walk(x, depth + 1));
    } else if (isObject(v)) {
      Object.values(v).forEach((x) => walk(x, depth + 1));
    }
  };

  walk(value, 0);
  return [...found];
}

// Téléphones : uniquement dans les champs dédiés (le texte libre donnerait trop de faux positifs)
function pickPhones(obj: Record<string, unknown>): string[] {
  const out = new Set<string>();
  for (const key of PHONE_KEYS) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) out.add(v.trim());
    if (Array.isArray(v)) v.forEach((x) => typeof x === "string" && x.trim() && out.add(x.trim()));
  }
  return [...out];
}

// Réseaux sociaux : champs "linkedIns", "facebooks"… (texte ou tableau de liens http(s))
function pickSocials(obj: Record<string, unknown>): SocialLink[] {
  const out: SocialLink[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const match = key.match(SOCIAL_KEY);
    if (!match) continue;
    const network = match[1].toLowerCase() as SocialNetwork;
    for (const candidate of Array.isArray(value) ? value : [value]) {
      if (typeof candidate !== "string") continue;
      const url = safeUrl(candidate.trim());
      if (url) out.push({ network, url });
    }
  }
  return out;
}

// Réseaux propres à un type de fiche : page LinkedIn de l'entreprise d'une offre, compte TikTok d'une vidéo
function extraSocials(kind: ResultKind, raw: Record<string, unknown>): SocialLink[] {
  const out: SocialLink[] = [];
  const add = (network: SocialNetwork, value: unknown) => {
    const url = safeUrl(typeof value === "string" ? value.trim() : null);
    if (url) out.push({ network, url });
  };
  if (kind === "job") add("linkedin", raw.companyLinkedinUrl);
  if (kind === "video" && isObject(raw.authorMeta)) add("tiktok", raw.authorMeta.profileUrl);
  return out;
}

function mergeSocials(...lists: SocialLink[][]): SocialLink[] {
  const seen = new Set<string>();
  const out: SocialLink[] = [];
  for (const list of lists) {
    for (const s of list) {
      if (!seen.has(s.url)) {
        seen.add(s.url);
        out.push(s);
      }
    }
  }
  return out;
}

// ---------- Détection du type de fiche ----------
const has = (o: Record<string, unknown>, k: string) => o[k] !== undefined && o[k] !== null;

export function detectKind(raw: Record<string, unknown>): ResultKind {
  // Vidéo (TikTok) : lien de vidéo ou bloc auteur avec statistiques
  if (
    typeof raw.webVideoUrl === "string" ||
    (isObject(raw.authorMeta) && (has(raw, "playCount") || isObject(raw.videoMeta)))
  ) {
    return "video";
  }
  // Offre d'emploi : entreprise + au moins un champ propre aux offres
  if (
    typeof raw.companyName === "string" &&
    ["descriptionText", "descriptionHtml", "salaryInfo", "employmentType", "seniorityLevel", "jobFunction", "applicantsCount", "jobPosterName"].some((k) => has(raw, k))
  ) {
    return "job";
  }
  // Profil de personne : prénom/nom + champ typique d'un profil
  if (
    (typeof raw.firstName === "string" || typeof raw.lastName === "string") &&
    ["headline", "publicIdentifier", "experience", "linkedinUrl"].some((k) => has(raw, k))
  ) {
    return "profile";
  }
  // Lieu (Google Maps)
  if (["placeId", "cid", "fid", "totalScore", "categoryName"].some((k) => has(raw, k))) return "place";
  return "other";
}

// ---------- Détails propres à chaque type ----------
interface KindDetails {
  title: string | null;
  tagline: string | null;
  category: string | null;
  facts: ResultFact[];
  badges: string[];
}
const NONE: KindDetails = { title: null, tagline: null, category: null, facts: [], badges: [] };

const textFact = (label: string, value: string | null): ResultFact | null =>
  value ? { label, value } : null;

const numberFact = (raw: Record<string, unknown>, key: string, label: string): ResultFact | null => {
  const n = pickNumber(raw, [key]);
  return n === null ? null : { label, value: compactFormat.format(n) };
};

const keep = (facts: (ResultFact | null)[]) => facts.filter((f): f is ResultFact => f !== null);

function salaryText(raw: Record<string, unknown>): string | null {
  const v = raw.salaryInfo;
  if (Array.isArray(v)) {
    const parts = v.filter((x): x is string => typeof x === "string" && x.trim() !== "").map((x) => x.trim());
    return parts.length ? parts.join(" – ") : null;
  }
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function kindDetails(kind: ResultKind, raw: Record<string, unknown>): KindDetails {
  switch (kind) {
    case "place":
      return {
        ...NONE,
        facts: keep([textFact("Prix", pickString(raw, ["price"])), textFact("Classement", pickString(raw, ["hotelStars"]))]),
      };

    case "job": {
      const badges = Array.isArray(raw.benefits)
        ? raw.benefits.filter((b): b is string => typeof b === "string" && b.trim() !== "").map((b) => b.trim())
        : [];
      if (raw.workRemoteAllowed === true) badges.push("Télétravail possible");
      return {
        ...NONE,
        tagline: pickString(raw, ["companyName"]),
        facts: keep([
          textFact("Salaire", salaryText(raw)),
          textFact("Contrat", pickString(raw, ["employmentType"])),
          textFact("Niveau", pickString(raw, ["seniorityLevel"])),
          numberFact(raw, "applicantsCount", "Candidats"),
        ]),
        badges,
      };
    }

    case "profile": {
      const name = [raw.firstName, raw.lastName]
        .filter((p): p is string => typeof p === "string" && p.trim() !== "")
        .map((p) => p.trim())
        .join(" ");
      const position = (Array.isArray(raw.currentPosition) ? raw.currentPosition : []).find(isObject);
      const badges: string[] = [];
      if (raw.openToWork === true) badges.push("Ouvert aux opportunités");
      if (raw.hiring === true) badges.push("Recrute");
      if (raw.verified === true) badges.push("Vérifié");
      if (raw.premium === true) badges.push("Premium");
      return {
        title: name || null,
        tagline: pickString(raw, ["headline"]),
        category: position ? pickString(position, ["companyName"]) : null,
        facts: keep([numberFact(raw, "connectionsCount", "Relations"), numberFact(raw, "followerCount", "Abonnés")]),
        badges,
      };
    }

    case "video": {
      const author = isObject(raw.authorMeta) ? raw.authorMeta : null;
      const display = author ? pickString(author, ["nickName", "name"]) : null;
      const handle = author ? pickString(author, ["name"]) : null;
      const badges: string[] = [];
      if (raw.isAd === true) badges.push("Publicité");
      if (raw.isSponsored === true) badges.push("Sponsorisée");
      if (raw.isSlideshow === true) badges.push("Diaporama");
      if (raw.isPinned === true) badges.push("Épinglée");
      return {
        ...NONE,
        title: pickString(raw, ["text"]) ?? (display ? `Vidéo de ${display}` : null),
        tagline: handle ? `@${handle}` : null,
        facts: keep([
          numberFact(raw, "playCount", "Vues"),
          numberFact(raw, "diggCount", "J'aime"),
          numberFact(raw, "commentCount", "Commentaires"),
          numberFact(raw, "shareCount", "Partages"),
        ]),
        badges,
      };
    }

    default:
      return NONE;
  }
}

/** Transforme un élément Apify en fiche standard. `raw` n'est jamais modifié. */
export function normalizeResult(item: unknown, index: number): NormalizedResult {
  // Un élément qui n'est pas un objet (rare) est conservé dans { value }
  const raw: Record<string, unknown> = isObject(item) ? item : { value: item };
  const kind = detectKind(raw);
  const details = kindDetails(kind, raw);
  const website = normalizeWebsite(pickString(raw, WEBSITE_KEYS));

  return {
    index,
    raw,
    kind,
    title: details.title ?? pickString(raw, TITLE_KEYS),
    tagline: details.tagline,
    subtitle: pickAddress(raw),
    category: details.category ?? pickString(raw, CATEGORY_KEYS),
    rating: pickNumber(raw, RATING_KEYS),
    reviewsCount: pickNumber(raw, REVIEWS_KEYS),
    description: pickString(raw, DESC_KEYS),
    url: safeUrl(pickString(raw, URL_KEYS)),
    website,
    websiteIsDirectory: isDirectoryHost(website),
    image: pickImage(raw),
    emails: extractEmails(raw),
    phones: pickPhones(raw),
    socials: mergeSocials(pickSocials(raw), extraSocials(kind, raw)),
    facts: details.facts,
    badges: details.badges,
    date: pickDate(raw),
  };
}

export const normalizeResults = (items: unknown[]): NormalizedResult[] =>
  items.map((item, i) => normalizeResult(item, i));