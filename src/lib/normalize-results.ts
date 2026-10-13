import type { NormalizedResult } from "@/types/results";

// Noms de champs courants, par ordre de priorité. Sert UNIQUEMENT à l'affichage.
const TITLE_KEYS = ["title", "name", "fullName", "displayName", "companyName", "username", "headline"];
const URL_KEYS = ["url", "link", "profileUrl", "website", "webUrl", "postUrl", "videoUrl"];
const DESC_KEYS = ["description", "text", "bio", "about", "summary", "snippet", "caption"];
const ADDRESS_KEYS = ["address", "location", "city", "fullAddress", "street"];
const DATE_KEYS = ["date", "publishedAt", "createdAt", "postedAt", "timestamp", "datePublished"];
const PHONE_KEYS = ["phone", "phones", "phoneNumber", "telephone", "mobile"];

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)*\.[A-Z]{2,}/gi;
const FAKE_TLDS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "css", "js"]); // "logo@2x.png"
const MAX_DEPTH = 5;
const MAX_NODES = 500; // garde-fou sur les objets énormes

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

// Première valeur texte non vide parmi les clés candidates (insensible à la casse)
function pickString(obj: Record<string, unknown>, keys: string[]): string | null {
  const lower = new Map(Object.keys(obj).map((k) => [k.toLowerCase(), k]));
  for (const key of keys) {
    const real = lower.get(key.toLowerCase());
    if (!real) continue;
    const v = obj[real];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return null;
}

// Un lien n'est affiché que s'il est http(s) : bloque javascript:, data:, etc.
export function safeUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

// Adresse : texte direct, ou assemblage des champs d'un objet { street, city, ... }
function pickAddress(obj: Record<string, unknown>): string | null {
  const direct = pickString(obj, ADDRESS_KEYS);
  if (direct) return direct;
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

/** Transforme un élément Apify en vue d'affichage. `raw` n'est jamais modifié. */
export function normalizeResult(item: unknown, index: number): NormalizedResult {
  // Un élément qui n'est pas un objet (rare) est conservé dans { value }
  const raw: Record<string, unknown> = isObject(item) ? item : { value: item };
  return {
    index,
    raw,
    title: pickString(raw, TITLE_KEYS),
    subtitle: pickAddress(raw),
    description: pickString(raw, DESC_KEYS),
    url: safeUrl(pickString(raw, URL_KEYS)),
    emails: extractEmails(raw),
    phones: pickPhones(raw),
    date: pickDate(raw),
  };
}

export const normalizeResults = (items: unknown[]): NormalizedResult[] =>
  items.map((item, i) => normalizeResult(item, i));