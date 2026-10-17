import "server-only"; // erreur de build si importé côté navigateur : les identifiants ne quittent jamais le serveur
import nodemailer from "nodemailer";

export class MailError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export interface MailConfig {
  user: string;
  pass: string;
  fromName: string | null;
}

/** Configuration lue sur le serveur ; null si elle est absente ou incomplète. */
export function getMailConfig(): MailConfig | null {
  const user = (process.env.GMAIL_USER ?? "").trim();
  const pass = (process.env.GMAIL_APP_PASSWORD ?? "").replace(/\s+/g, ""); // Google l'affiche par groupes de 4
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user) || pass.length < 8) return null;
  // Pas de saut de ligne ni de guillemets dans le nom affiché
  const fromName = (process.env.MAIL_FROM_NAME ?? "").replace(/[\r\n"<>]/g, "").trim().slice(0, 60);
  return { user, pass, fromName: fromName || null };
}

/** Nombre maximal d'envois par jour (entre 1 et 200, 30 par défaut). */
export function dailyMailLimit(): number {
  const n = Number(process.env.MAIL_DAILY_LIMIT);
  return Number.isInteger(n) && n >= 1 ? Math.min(n, 200) : 30;
}

export interface OutgoingMail {
  to: string;
  subject: string;
  text: string;
  attachments: { filename: string; content: Uint8Array; contentType: string }[];
}

export async function sendMail(cfg: MailConfig, mail: OutgoingMail): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: cfg.user, pass: cfg.pass },
    // Ne bloque jamais indéfiniment
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  try {
    await transporter.sendMail({
      from: cfg.fromName ? { name: cfg.fromName, address: cfg.user } : cfg.user,
      replyTo: cfg.user,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      attachments: mail.attachments.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content),
        contentType: a.contentType,
      })),
    });
  } catch (e) {
    // Messages génériques : on ne renvoie jamais le détail technique (il pourrait contenir l'identifiant)
    const code = (e as { code?: string }).code;
    if (code === "EAUTH") {
      throw new MailError("Gmail a refusé les identifiants : vérifie GMAIL_USER et le mot de passe d'application", 502);
    }
    if (code === "ETIMEDOUT" || code === "ECONNECTION" || code === "ESOCKET" || code === "ECONNREFUSED") {
      throw new MailError("Connexion à Gmail impossible : réseau coupé, ou ports d'envoi bloqués par l'hébergeur", 504);
    }
    throw new MailError("Gmail a refusé l'envoi de ce message", 502);
  } finally {
    transporter.close();
  }
}