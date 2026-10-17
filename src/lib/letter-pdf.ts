// PDF de la lettre, généré dans le navigateur (aucun envoi).
export interface LetterPdfResult {
  bytes: Uint8Array;
  replacedChars: number; // caractères que la police du PDF ne sait pas écrire (remplacés)
}

const PAGE = { width: 595.28, height: 841.89 }; // A4, en points
const MARGIN = 56;
const FONT_SIZE = 11;
const LINE_HEIGHT = 16;

export async function buildLetterPdf(
  text: string,
  meta: { title: string; author: string }
): Promise<LetterPdfResult> {
  // Chargé seulement au moment de créer un PDF
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  doc.setTitle(meta.title);
  doc.setAuthor(meta.author);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const supported = new Set(font.getCharacterSet());

  // Les accents français sont pris en charge ; les caractères hors police sont remplacés (« ŵ » → « w », sinon « ? »)
  let replacedChars = 0;
  const sanitize = (input: string) =>
    Array.from(input.replace(/\r\n?/g, "\n").replace(/\t/g, "    ").replace(/\u00a0/g, " "))
      .map((ch) => {
        if (ch === "\n") return ch;
        const cp = ch.codePointAt(0)!;
        if (supported.has(cp)) return ch;
        replacedChars++;
        const base = ch.normalize("NFD")[0];
        return base && supported.has(base.codePointAt(0)!) ? base : "?";
      })
      .join("");

  const maxWidth = PAGE.width - 2 * MARGIN;
  const fits = (s: string) => font.widthOfTextAtSize(s, FONT_SIZE) <= maxWidth;
  let page = doc.addPage([PAGE.width, PAGE.height]);
  let y = PAGE.height - MARGIN - FONT_SIZE;

  const draw = (line: string) =>
    page.drawText(line, { x: MARGIN, y, size: FONT_SIZE, font, color: rgb(0.07, 0.07, 0.07) });
  const nextLine = () => {
    y -= LINE_HEIGHT;
    if (y < MARGIN) {
      page = doc.addPage([PAGE.width, PAGE.height]); // nouvelle page quand la précédente est pleine
      y = PAGE.height - MARGIN - FONT_SIZE;
    }
  };

  for (const paragraph of sanitize(text).split("\n")) {
    if (paragraph.trim() === "") {
      nextLine(); // ligne vide
      continue;
    }
    let line = "";
    for (const word of paragraph.split(" ")) {
      const candidate = line ? `${line} ${word}` : word;
      if (fits(candidate)) {
        line = candidate;
        continue;
      }
      if (line) {
        draw(line);
        nextLine();
        line = "";
      }
      // Mot plus large qu'une ligne (adresse web) : coupé en morceaux
      let rest = word;
      while (!fits(rest)) {
        let n = rest.length;
        while (n > 1 && !fits(rest.slice(0, n))) n--;
        draw(rest.slice(0, n));
        nextLine();
        rest = rest.slice(n);
      }
      line = rest;
    }
    if (line) draw(line);
    nextLine();
  }

  return { bytes: await doc.save(), replacedChars };
}