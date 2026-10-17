import { NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { dailyMailLimit, getMailConfig, MailError, sendMail } from "@/lib/mail";
import { checkAttachment, MAX_REQUEST_CHARS, safeFilename, sendMailSchema } from "@/lib/mail-validation";
import { rateLimit } from "@/lib/rate-limit";

const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status });

// POST /api/mail/send   corps : { to, subject, text, attachments? }
export async function POST(req: Request) {
  try {
    const denied = await guard(req, "mail"); // session valide + limite de requêtes
    if (denied) return denied;

    const cfg = getMailConfig();
    if (!cfg) return fail("Envoi d'emails non configuré sur le serveur", 503);

    if (Number(req.headers.get("content-length") ?? 0) > MAX_REQUEST_CHARS) {
      return fail("Requête trop volumineuse", 413);
    }
    const raw = await req.text();
    if (raw.length > MAX_REQUEST_CHARS) return fail("Requête trop volumineuse", 413);

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return fail("JSON invalide", 400);
    }
    const parsed = sendMailSchema.safeParse(json);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Requête invalide", 400);
    const { to, subject, text, attachments } = parsed.data;

    // On contrôle le contenu réel de chaque fichier, pas seulement son nom
    const files: { filename: string; content: Uint8Array; contentType: string }[] = [];
    for (const a of attachments) {
      const bytes = new Uint8Array(Buffer.from(a.contentBase64, "base64"));
      const problem = checkAttachment(a.mime, bytes);
      if (problem) return fail(problem, 400);
      files.push({ filename: safeFilename(a.filename, a.mime), content: bytes, contentType: a.mime });
    }

    // Plafond quotidien global : protège la réputation de ton adresse Gmail
    const daily = rateLimit("mail:day", dailyMailLimit(), 24 * 60 * 60_000);
    if (!daily.ok) {
      return fail(`Limite quotidienne d'envois atteinte : réessaie dans ${Math.ceil(daily.retryAfterS / 3600)} h`, 429);
    }

    await sendMail(cfg, { to, subject, text, attachments: files });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof MailError) return fail(e.message, e.status);
    return fail("Erreur serveur", 500);
  }
}