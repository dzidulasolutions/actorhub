import type { NormalizedResult, SocialLink, SocialNetwork } from "@/types/results";

// Noms de champs courants (relevés sur les Actors Google Maps et Contact Details),
// par ordre de priorité. Sert UNIQUEMENT à l'affichage, jamais à modifier les données.
const TITLE_KEYS = ["title", "name", "fullName", "displayName", "companyName", "profileName", "username", "headline"];
const URL_KEYS = ["url", "link", "profileUrl", "webUrl", "postUrl", "videoUrl"];
const WEBSITE_KEYS = ["website", "companyWebsite", "domain"];
const CATEGORY_KEYS = ["categoryName", "category", "categories", "industry"];
const RATING_KEYS = ["totalScore", "rating", "stars", "score"];
const REVIEWS_KEYS = ["reviewsCount", "reviews", "numberOfReviews", "ratingCount"];
const DESC_KEYS = ["description", "text", "bio", "about", "summary", "snippet", "caption"];
const ADDRESS_KEYS = ["address", "location", "fullAddress", "street", "city"];
const DATE_KEYS = ["date", "publishedAt", "createdAt", "postedAt", "timestamp", "datePublished"];
const PHONE_KEYS = ["phone", "phones", "phoneNumber", "telephone", "mobile"];

// 1. Avec les autres constantes en haut du fichier
const IMAGE_KEYS = ["imageUrl", "image", "thumbnail", "thumbnailUrl", "profilePicture", "avatar", "photoUrl"];

// 2. Avant pickAddress : retire le "plus code" Google en début d'adresse (ex. "4696+38F, ")
const stripPlusCode = (s: string) => s.replace(/^[A-Z0-9]{4,8}\+[A-Z0-9]{2,3},?\s+/, "");

// "linkedIns", "facebooks", "instagram"… (avec ou sans "s" final)
const SOCIAL_KEY = /^(linkedin|facebook|instagram|twitter|youtube|tiktok)s?$/i;

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)*\.[A-Z]{2,}/gi;
const FAKE_TLDS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "css", "js"]); // "logo@2x.png"
const MAX_DEPTH = 5;
const MAX_NODES = 500; // garde-fou sur les objets énormes

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

// Adresse : texte direct, ou assemblage des champs d'un objet { street, city, ... }
function pickAddress(obj: Record<string, unknown>): string | null {
  const direct = pickString(obj, ADDRESS_KEYS);
    if (direct) return stripPlusCode(direct);
  for (const key of ADDRESS_KEYS) {
    const v = obj[key];
    if (isObject(v)) {
      const parts = ["street", "city", "state", "postalCode", "country"]
        .map((k) => v[k])
        .filter((p): p is string => typeof p === "string" && p.trim() !== "");
      if (parts.length) return parts.join(", ");
    }
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
  const seen = new Set<string>();
  const out: SocialLink[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const match = key.match(SOCIAL_KEY);
    if (!match) continue;
    const network = match[1].toLowerCase() as SocialNetwork;
    for (const candidate of Array.isArray(value) ? value : [value]) {
      if (typeof candidate !== "string") continue;
      const url = safeUrl(candidate.trim());
      if (url && !seen.has(url)) {
        seen.add(url);
        out.push({ network, url });
      }
    }
  }
  return out;
}

/** Transforme un élément Apify en fiche standard. `raw` n'est jamais modifié. */
export function normalizeResult(item: unknown, index: number): NormalizedResult {
  // Un élément qui n'est pas un objet (rare) est conservé dans { value }
  const raw: Record<string, unknown> = isObject(item) ? item : { value: item };
  return {
    index,
    raw,
    title: pickString(raw, TITLE_KEYS),
    subtitle: pickAddress(raw),
    category: pickString(raw, CATEGORY_KEYS),
    rating: pickNumber(raw, RATING_KEYS),
    reviewsCount: pickNumber(raw, REVIEWS_KEYS),
    description: pickString(raw, DESC_KEYS),
    url: safeUrl(pickString(raw, URL_KEYS)),
    website: normalizeWebsite(pickString(raw, WEBSITE_KEYS)),
    emails: extractEmails(raw),
    phones: pickPhones(raw),
    socials: pickSocials(raw),
    date: pickDate(raw),
    // 3. Dans l'objet renvoyé par normalizeResult, après la ligne `website: ...`
    image: (() => {
      const img = safeUrl(pickString(raw, IMAGE_KEYS));
      return img?.startsWith("https:") ? img : null; // images en https uniquement
    })(),
  };
}

export const normalizeResults = (items: unknown[]): NormalizedResult[] =>
  items.map((item, i) => normalizeResult(item, i));