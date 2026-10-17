import { describe, expect, it } from "vitest";
import { checkAttachment, MAX_ATTACHMENT_BYTES, safeFilename, sendMailSchema } from "./mail-validation";

const valid = { to: "rh@entreprise.com", subject: "Candidature", text: "Bonjour" };

describe("sendMailSchema", () => {
  it("accepte une demande valide, avec ou sans pièce jointe", () => {
    expect(sendMailSchema.safeParse(valid).success).toBe(true);
    const withFile = { ...valid, attachments: [{ filename: "lettre.pdf", mime: "application/pdf", contentBase64: "JVBERi0=" }] };
    expect(sendMailSchema.safeParse(withFile).success).toBe(true);
  });

  it("refuse plusieurs destinataires ou un faux nom d'expéditeur", () => {
    for (const to of ["a@b.tg, c@d.tg", "a@b.tg;c@d.tg", "Nom <a@b.tg>", '"x"@b.tg', "a@b.tg\nBcc: c@d.tg", "sans-arobase"]) {
      expect(sendMailSchema.safeParse({ ...valid, to }).success).toBe(false);
    }
  });

  it("refuse un objet avec saut de ligne (injection d'en-têtes) ou un message vide", () => {
    expect(sendMailSchema.safeParse({ ...valid, subject: "Objet\nBcc: x@y.tg" }).success).toBe(false);
    expect(sendMailSchema.safeParse({ ...valid, text: "" }).success).toBe(false);
  });

  it("refuse les types de fichiers non autorisés, le base64 invalide et les fichiers trop gros", () => {
    const att = (over: object) => ({ ...valid, attachments: [{ filename: "a.pdf", mime: "application/pdf", contentBase64: "JVBERi0=", ...over }] });
    expect(sendMailSchema.safeParse(att({ mime: "application/x-msdownload" })).success).toBe(false);
    expect(sendMailSchema.safeParse(att({ contentBase64: "pas du base64 !!" })).success).toBe(false);
    expect(sendMailSchema.safeParse(att({ contentBase64: "A".repeat(3_000_000) })).success).toBe(false);
  });

  it("refuse plus de deux pièces jointes", () => {
    const one = { filename: "a.pdf", mime: "application/pdf", contentBase64: "JVBERi0=" };
    expect(sendMailSchema.safeParse({ ...valid, attachments: [one, one, one] }).success).toBe(false);
  });
});

describe("safeFilename", () => {
  it("nettoie le nom et force la bonne extension", () => {
    expect(safeFilename("lettre", "application/pdf")).toBe("lettre.pdf");
    expect(safeFilename("Mon CV (2026).PDF", "application/pdf")).toBe("Mon_CV_2026_.PDF");
    const sneaky = safeFilename("../../etc/passwd", "application/pdf");
    expect(sneaky).not.toMatch(/[\\/]/);
    expect(sneaky.startsWith(".")).toBe(false);
    expect(safeFilename("", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe("document.docx");
  });
});

describe("checkAttachment", () => {
  const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]); // « %PDF-1 »
  const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04]); // « PK »
  const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  it("vérifie le contenu réel du fichier", () => {
    expect(checkAttachment("application/pdf", pdf)).toBeNull();
    expect(checkAttachment(DOCX, zip)).toBeNull();
    expect(checkAttachment("application/pdf", zip)).not.toBeNull(); // un zip déguisé en PDF
    expect(checkAttachment(DOCX, pdf)).not.toBeNull();
    expect(checkAttachment("application/pdf", new Uint8Array(0))).not.toBeNull();
    expect(checkAttachment("application/pdf", new Uint8Array(MAX_ATTACHMENT_BYTES + 1))).not.toBeNull();
  });
});