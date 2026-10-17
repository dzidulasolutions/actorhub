import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { cleanCvText, CvImportError, detectCvKind, docxXmlToText, extractDocxText } from "./cv-text";

const xml = `<w:document><w:body>
<w:p><w:pPr><w:tabs><w:tab w:val="left" w:pos="720"/></w:tabs></w:pPr><w:r><w:t>Gamatho</w:t></w:r><w:r><w:tab/></w:r><w:r><w:t xml:space="preserve">Lomé &amp; Paris</w:t></w:r></w:p>
<w:p><w:r><w:instrText> HYPERLINK "x" </w:instrText></w:r><w:r><w:t>Développeur</w:t></w:r><w:r><w:br/></w:r><w:r><w:t>React</w:t></w:r></w:p>
</w:body></w:document>`;

describe("docxXmlToText", () => {
  it("extrait le texte, les tabulations et les paragraphes", () => {
    // Les taquets <w:tabs> et les codes de champs <w:instrText> ne produisent aucun texte parasite
    expect(docxXmlToText(xml)).toBe("Gamatho\tLomé & Paris\nDéveloppeur\nReact");
  });

  it("décode les entités numériques", () => {
    expect(docxXmlToText("<w:p><w:r><w:t>caf&#233; &#x41;</w:t></w:r></w:p>")).toBe("café A");
  });
});

describe("extractDocxText", () => {
  it("lit un vrai fichier .docx (archive zip)", () => {
    const zip = zipSync({
      "[Content_Types].xml": strToU8("<Types/>"),
      "word/document.xml": strToU8(xml),
    });
    expect(extractDocxText(zip)).toBe("Gamatho\tLomé & Paris\nDéveloppeur\nReact");
  });

  it("refuse une archive sans document Word, et un fichier qui n'est pas une archive", () => {
    expect(() => extractDocxText(zipSync({ "a.txt": strToU8("x") }))).toThrow(CvImportError);
    expect(() => extractDocxText(new Uint8Array([1, 2, 3]))).toThrow();
  });
});

describe("cleanCvText", () => {
  it("normalise sauts de ligne et espaces", () => {
    expect(cleanCvText("a  \r\n\r\n\r\n\r\nb\u00a0c  \n")).toBe("a\n\nb c");
  });
});

describe("detectCvKind", () => {
  it("reconnaît le type par l'extension ou par le type MIME", () => {
    expect(detectCvKind("CV.PDF", "")).toBe("pdf");
    expect(detectCvKind("cv.docx", "")).toBe("docx");
    expect(detectCvKind("sans-extension", "application/pdf")).toBe("pdf");
    expect(detectCvKind("notes.txt", "")).toBe("text");
    expect(detectCvKind("ancien.doc", "application/msword")).toBeNull();
    expect(detectCvKind("photo.png", "image/png")).toBeNull();
  });
});