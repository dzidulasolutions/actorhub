// Extraction du texte d'un CV, 100 % dans le navigateur : le fichier n'est jamais envoyé.
import { strFromU8, unzipSync } from "fflate";
import { MAX_CV_CHARS } from "./profile-schema";

export const MAX_CV_FILE_BYTES = 5 * 1024 * 1024; // 5 Mo
const MAX_PDF_PAGES = 20;
const MAX_DOCX_XML_BYTES = 10 * 1024 * 1024; // garde-fou contre une archive piégée
const MIN_CV_CHARS = 50; // en dessous, on considère qu'il n'y a pas de vrai texte

// Erreur dont le message est destiné à l'utilisateur
export class CvImportError extends Error {}

export type CvKind = "pdf" | "docx" | "text";

export function detectCvKind(name: string, mime: string): CvKind | null {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (ext === "pdf" || mime === "application/pdf") return "pdf";
  if (
    ext === "docx" ||
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }
  if (ext === "txt" || ext === "md" || mime === "text/plain") return "text";
  return null;
}

/** Normalise les sauts de ligne et les espaces d'un texte extrait. */
export function cleanCvText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/\u00a0/g, " ") // espace insécable
    .replace(/[ \t]+\n/g, "\n") // espaces en fin de ligne
    .replace(/\n{3,}/g, "\n\n") // pas plus d'une ligne vide d'affilée
    .trim();
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&"); // en dernier : sinon « &amp;lt; » serait décodé deux fois
}

// Marqueurs internes (caractères d'usage privé) pour les tabulations et sauts de ligne
const TAB = "\uE000";
const NL = "\uE001";

/** Texte brut d'un document Word : contenu des <w:t>, paragraphes → lignes, <w:tab/> → tabulation. */
export function docxXmlToText(xml: string): string {
  const marked = xml
    .replace(/<w:tabs>[\s\S]*?<\/w:tabs>/g, "") // définitions de taquets : ce ne sont pas des tabulations
    .replace(/<w:tab\b[^>]*\/>/g, TAB)
    .replace(/<w:(?:br|cr)\b[^>]*\/>/g, NL)
    .replace(/<\/w:p>/g, NL);

  const out: string[] = [];
  // Soit le texte d'un <w:t>, soit un de nos marqueurs. <w:instrText> (codes de champs) est ignoré.
  const re = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|([\uE000\uE001])/g;
  for (const m of marked.matchAll(re)) {
    if (m[1] !== undefined) out.push(decodeXmlEntities(m[1]));
    else out.push(m[2] === TAB ? "\t" : "\n");
  }
  return cleanCvText(out.join(""));
}

export function extractDocxText(data: Uint8Array): string {
  // Le filtre ne décompresse QUE le fichier utile, et seulement s'il est de taille raisonnable
  const files = unzipSync(data, {
    filter: (f) => f.name === "word/document.xml" && f.originalSize <= MAX_DOCX_XML_BYTES,
  });
  const xml = files["word/document.xml"];
  if (!xml) throw new CvImportError("Fichier Word invalide ou protégé");
  return docxXmlToText(strFromU8(xml));
}

async function extractPdfText(data: Uint8Array): Promise<string> {
  // Chargé seulement quand on importe un PDF : la bibliothèque est volumineuse
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(data);
  if (pdf.numPages > MAX_PDF_PAGES) {
    throw new CvImportError(`PDF trop long (${MAX_PDF_PAGES} pages maximum)`);
  }
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

export async function extractCvText(file: File): Promise<{ text: string; truncated: boolean }> {
  if (file.size > MAX_CV_FILE_BYTES) {
    throw new CvImportError(`Fichier trop volumineux (${MAX_CV_FILE_BYTES / 1024 / 1024} Mo maximum)`);
  }
  const kind = detectCvKind(file.name, file.type);
  if (!kind) throw new CvImportError("Format non pris en charge : utilise un PDF, un .docx ou un .txt");

  let raw: string;
  try {
    if (kind === "text") {
      raw = await file.text();
    } else {
      const data = new Uint8Array(await file.arrayBuffer());
      raw = kind === "pdf" ? await extractPdfText(data) : extractDocxText(data);
    }
  } catch (e) {
    if (e instanceof CvImportError) throw e;
    throw new CvImportError("Lecture impossible : le fichier est peut-être protégé par un mot de passe ou abîmé");
  }

  const text = cleanCvText(raw);
  if (text.length < MIN_CV_CHARS) {
    throw new CvImportError(
      kind === "pdf"
        ? "Aucun texte trouvé : ce PDF est peut-être une image scannée (non prise en charge)"
        : "Le fichier ne contient presque pas de texte"
    );
  }
  const truncated = text.length > MAX_CV_CHARS;
  return { text: truncated ? text.slice(0, MAX_CV_CHARS) : text, truncated };
}