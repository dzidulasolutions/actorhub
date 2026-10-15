// Session signée (HMAC-SHA256). Utilisable dans le proxy et dans les routes.
export const SESSION_COOKIE = "actorhub_session";
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 7; // 7 jours

const encoder = new TextEncoder();

const toHex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

// Comparaison en temps constant : ne révèle pas où deux textes diffèrent
export function safeEqual(a: string, b: string): boolean {
  const x = encoder.encode(a);
  const y = encoder.encode(b);
  let diff = x.length ^ y.length;
  const len = Math.max(x.length, y.length);
  for (let i = 0; i < len; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

/** Jeton de session : "v1.<expiration>.<signature>". Rien de secret dedans. */
export async function createSessionToken(secret: string, now = Date.now()): Promise<string> {
  const payload = `v1.${Math.floor(now / 1000) + SESSION_MAX_AGE_S}`;
  return `${payload}.${await hmac(secret, payload)}`;
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string,
  now = Date.now()
): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return false;
  const [version, exp, sig] = parts;
  const expSeconds = Number(exp);
  if (!Number.isInteger(expSeconds) || expSeconds * 1000 < now) return false; // expiré
  return safeEqual(sig, await hmac(secret, `${version}.${exp}`));
}

/**
 * Configuration lue sur le serveur. Si elle est absente ou trop faible, on renvoie null
 * et TOUT est refusé : mieux vaut une app fermée qu'une app ouverte par oubli.
 */
export function getAuthConfig(): { accessCode: string; sessionSecret: string } | null {
  const accessCode = process.env.ACCESS_CODE ?? "";
  const sessionSecret = process.env.SESSION_SECRET ?? "";
  if (accessCode.length < 8 || sessionSecret.length < 32) return null;
  return { accessCode, sessionSecret };
}