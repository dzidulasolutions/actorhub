import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { buildLetterPdf } from "./letter-pdf";

const meta = { title: "Candidature", author: "Gamatho" };

describe("buildLetterPdf", () => {
  it("produit un vrai PDF et garde les accents français", async () => {
    const { bytes, replacedChars } = await buildLetterPdf("Éléphant à côté, œuvre ’ – …", meta);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    expect(replacedChars).toBe(0);
  });

  it("ajoute des pages quand le texte est long", async () => {
    const long = Array.from({ length: 120 }, (_, i) => `Ligne numéro ${i + 1} de la lettre.`).join("\n");
    const { bytes } = await buildLetterPdf(long, meta);
    expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThan(1);
  });

  it("remplace les caractères que la police ne sait pas écrire", async () => {
    const { replacedChars } = await buildLetterPdf("Ɖeke ŵ 😀", meta);
    expect(replacedChars).toBe(3);
  });

  it("coupe un mot plus large qu'une ligne sans planter", async () => {
    const { bytes } = await buildLetterPdf(`https://exemple.com/${"a".repeat(300)}`, meta);
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
  });
});