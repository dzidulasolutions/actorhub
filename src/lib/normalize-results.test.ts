import { describe, expect, it } from "vitest";
import { extractEmails, normalizeResult, safeUrl } from "./normalize-results";

describe("extractEmails", () => {
  it("trouve les emails dans un champ simple, un tableau et un objet imbriqué", () => {
    const item = {
      email: "Contact@Exemple.com",
      contactInfo: { emails: ["info@exemple.com", "contact@exemple.com"] },
      description: "Écrivez-nous : vente@exemple.tg",
    };
    expect(extractEmails(item).sort()).toEqual(
      ["contact@exemple.com", "info@exemple.com", "vente@exemple.tg"].sort()
    );
  });

  it("ignore les faux positifs de type fichier image", () => {
    expect(extractEmails({ logo: "https://cdn.x/logo@2x.png" })).toEqual([]);
  });
});

describe("safeUrl", () => {
  it("accepte http(s) et refuse les autres protocoles", () => {
    expect(safeUrl("https://example.com")).toBe("https://example.com/");
    expect(safeUrl("javascript:alert(1)")).toBeNull();
    expect(safeUrl("pas une url")).toBeNull();
  });
});

describe("normalizeResult", () => {
  it("garde l'objet original intact et reconnaît les champs courants", () => {
    const item = { title: "Resto", address: "Lomé", url: "https://x.com", custom: { a: 1 } };
    const r = normalizeResult(item, 3);
    expect(r.index).toBe(3);
    expect(r.title).toBe("Resto");
    expect(r.subtitle).toBe("Lomé");
    expect(r.raw).toBe(item); // même référence : rien n'est copié ni supprimé
    expect(r.raw.custom).toEqual({ a: 1 });
  });

  it("supporte un élément qui n'est pas un objet", () => {
    expect(normalizeResult("texte", 0).raw).toEqual({ value: "texte" });
  });
});