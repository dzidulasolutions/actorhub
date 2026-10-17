import { z } from "zod";

export const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024; // 2 Mo par pièce jointe
export const MAX_ATTACHMENTS = 2; // lettre + CV
export const MAX_REQUEST_CHARS = 6_000_000; // 2 pièces jointes en base64 + le texte

export const ALLOWED_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;
export type AllowedMime = (typeof ALLOWED_MIME)[number];

// Une seule adresse : on refuse virgules, points-virgules, chevrons et guillemets
// (empêche d'ajouter des destinataires cachés ou un faux nom d'expéditeur)
const SINGLE_EMAIL = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/;
export const isSingleEmail = (v: string) => SINGLE_EMAIL.test(v);

const noLineBreak = (s: string) => !/[\r\n]/.test(s); // un saut de ligne dans l'objet permettrait d'injecter des en-têtes
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

export function base64DecodedSize(b64: string): number {
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - padding;
}

export const attachmentSchema = z.object({
  filename: z.string().min(1).max(100),
  mime: z.enum(ALLOWED_MIME),
  contentBase64: z
    .string()
    .min(1)
    .refine((b) => BASE64.test(b), "Pièce jointe invalide")
    .refine((b) => base64DecodedSize(b) <= MAX_ATTACHMENT_BYTES, "Pièce jointe trop volumineuse (2 Mo maximum)"),
});

export const sendMailSchema = z.object({
  to: z.string().trim().max(200).refine(isSingleEmail, "Une seule adresse email valide est attendue"),
  subject: z.string().trim().min(1, "Objet vide").max(200, "Objet trop long").refine(noLineBreak, "Objet invalide"),
  text: z.string().min(1, "Message vide").max(20_000, "Message trop long"),
  attachments: z.array(attachmentSchema).max(MAX_ATTACHMENTS, "Deux pièces jointes maximum").default([]),
});

export type SendMailInput = z.infer<typeof sendMailSchema>;

/** Nom de fichier sûr : pas de chemin, pas de caractères spéciaux, extension cohérente avec le type. */
export function safeFilename(name: string, mime: AllowedMime): string {
  const ext = mime === "application/pdf" ? ".pdf" : ".docx";
  let base = name
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 80);
  if (!base) base = "document";
  return base.toLowerCase().endsWith(ext) ? base : `${base}${ext}`;
}

/** Vérifie le contenu réel du fichier (et pas seulement son nom) : renvoie un message d'erreur ou null. */
export function checkAttachment(mime: AllowedMime, bytes: Uint8Array): string | null {
  if (bytes.length === 0) return "Pièce jointe vide";
  if (bytes.length > MAX_ATTACHMENT_BYTES) return "Pièce jointe trop volumineuse (2 Mo maximum)";
  if (mime === "application/pdf") {
    // Un PDF commence par « %PDF- »
    const ok = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;
    return ok ? null : "Le fichier n'est pas un vrai PDF";
  }
  // Un .docx est une archive zip : elle commence par « PK »
  return bytes[0] === 0x50 && bytes[1] === 0x4b ? null : "Le fichier n'est pas un vrai document Word (.docx)";
}