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
  it("reconnaît une fiche de type Google Maps", () => {
    const item = {
      title: "Chez Mario",
      address: "Rue 12, Lomé",
      categoryName: "Italian Restaurant",
      totalScore: 4.6,
      reviewsCount: 120,
      website: "trattoria.example.com", // domaine nu → https:// ajouté
      phone: "+228 90 00 00 00",
      url: "https://www.google.com/maps/place/x",
      emails: ["contact@trattoria.example.com"],
    };
    const r = normalizeResult(item, 0);
    expect(r.title).toBe("Chez Mario");
    expect(r.category).toBe("Italian Restaurant");
    expect(r.rating).toBe(4.6);
    expect(r.reviewsCount).toBe(120);
    expect(r.website).toBe("https://trattoria.example.com/");
    expect(r.phones).toEqual(["+228 90 00 00 00"]);
    expect(r.emails).toEqual(["contact@trattoria.example.com"]);
    expect(r.url).toBe("https://www.google.com/maps/place/x");
  });

  it("reconnaît une fiche de type Contact Details (tableaux de réseaux sociaux)", () => {
    const item = {
      url: "https://apify.com",
      domain: "apify.com",
      emails: ["hello@apify.com"],
      phones: [],
      linkedIns: ["https://www.linkedin.com/company/apify"],
      facebooks: [],
    };
    const r = normalizeResult(item, 1);
    expect(r.title).toBeNull(); // pas de titre : l'interface se rabattra sur le site
    expect(r.website).toBe("https://apify.com/");
    expect(r.emails).toEqual(["hello@apify.com"]);
    expect(r.socials).toEqual([
      { network: "linkedin", url: "https://www.linkedin.com/company/apify" },
    ]);
  });

  it("prend la première catégorie d'un tableau", () => {
    expect(normalizeResult({ categories: ["Café", "Bar"] }, 0).category).toBe("Café");
  });

  it("garde l'objet original intact", () => {
    const item = { title: "Resto", custom: { a: 1 } };
    const r = normalizeResult(item, 3);
    expect(r.index).toBe(3);
    expect(r.raw).toBe(item); // même référence : rien n'est copié ni supprimé
    expect(r.raw.custom).toEqual({ a: 1 });
  });

  it("supporte un élément qui n'est pas un objet", () => {
    expect(normalizeResult("texte", 0).raw).toEqual({ value: "texte" });
  });

    it("reconnaît une vraie fiche Google Maps (Lomé) sans site web", () => {
    const item = {
      title: "SEA VIEW ROOFTOP INDIAN RESTAURANTS AND HOTELS",
      categoryName: "Restaurant indien",
      address: "4696+38F, Rue des Camomilles, Lomé, Togo",
      phone: "+228 99 91 00 09",
      totalScore: 4.6,
      reviewsCount: 23,
      location: { lat: 6.1176797, lng: 1.2107376 },
      imageUrl: "https://lh3.googleusercontent.com/x",
      url: "https://www.google.com/maps/search/?api=1&query=x",
      emails: [],
      phones: [],
      linkedIns: [],
    };
    const r = normalizeResult(item, 0);
    expect(r.subtitle).toBe("Rue des Camomilles, Lomé, Togo"); // code Google retiré
    expect(r.phones).toEqual(["+228 99 91 00 09"]);
    expect(r.emails).toEqual([]);
    expect(r.website).toBeNull();
    expect(r.image).toBe("https://lh3.googleusercontent.com/x");
  });
  
});