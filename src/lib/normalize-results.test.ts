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

    it("reconnaît un annuaire comme site et ignore les numéros incertains", () => {
    const item = {
      title: "Royal Hotel",
      website: "https://www.goafricaonline.com/tg/4711-royal-hotels-lome-togo",
      phone: "+228 70 26 92 77",
      phonesUncertain: ["79 87 12 04", "93 54 26 14"], // numéros de la page de l'annuaire
      facebooks: ["https://www.facebook.com/ShafRoyalhotel"],
      emails: [],
    };
    const r = normalizeResult(item, 0);
    expect(r.websiteIsDirectory).toBe(true);
    expect(r.phones).toEqual(["+228 70 26 92 77"]);
    expect(r.socials).toEqual([{ network: "facebook", url: "https://www.facebook.com/ShafRoyalhotel" }]);
    expect(r.emails).toEqual([]);
  });

    it("reconnaît une offre d'emploi LinkedIn", () => {
    const item = {
      id: "3692563200",
      link: "https://www.linkedin.com/jobs/view/english-data-labeling-analyst-at-facebook-3692563200",
      title: "English Data Labeling Analyst",
      companyName: "Facebook",
      companyLinkedinUrl: "https://www.linkedin.com/company/facebook",
      companyLogo: "https://media.licdn.com/dms/image/x/company-logo_100_100/0/1",
      location: "Los Angeles Metropolitan Area",
      salaryInfo: ["$17.00", "$19.00"],
      postedAt: "2023-08-16",
      benefits: ["Actively Hiring"],
      descriptionHtml: "<p>APPROVED REMOTE LOCATIONS:</p>",
      descriptionText: "APPROVED REMOTE LOCATIONS: Los Angeles",
      applicantsCount: "200",
      employmentType: "Contract",
      seniorityLevel: "Associate",
      industries: "Retail Office Equipment",
      companyWebsite: "https://www.meta.com",
    };
    const r = normalizeResult(item, 0);
    expect(r.kind).toBe("job");
    expect(r.title).toBe("English Data Labeling Analyst");
    expect(r.tagline).toBe("Facebook");
    expect(r.subtitle).toBe("Los Angeles Metropolitan Area");
    expect(r.category).toBe("Retail Office Equipment");
    expect(r.description).toBe("APPROVED REMOTE LOCATIONS: Los Angeles"); // texte brut, jamais le HTML
    expect(r.website).toBe("https://www.meta.com/");
    expect(r.image).toBe("https://media.licdn.com/dms/image/x/company-logo_100_100/0/1");
    expect(r.date).toBe("2023-08-16");
    expect(r.badges).toEqual(["Actively Hiring"]);
    expect(r.facts.find((f) => f.label === "Salaire")?.value).toBe("$17.00 – $19.00");
    expect(r.facts.find((f) => f.label === "Contrat")?.value).toBe("Contract");
    expect(r.facts.map((f) => f.label)).toContain("Candidats");
    expect(r.socials).toEqual([{ network: "linkedin", url: "https://www.linkedin.com/company/facebook" }]);
    expect(r.emails).toEqual([]);
  });

  it("reconnaît un profil LinkedIn (nom composé, localisation en objet)", () => {
    const item = {
      id: "ACoAACLevxsBfWQoDUYkHyCP2jzl81cDAvckQEI",
      linkedinUrl: "https://www.linkedin.com/in/towhid-rahman",
      firstName: "Towhid",
      lastName: "Rahman, PharmD",
      headline: "Pharmacology | Medical Science Liasion",
      about: "I find myself at a unique crossroads where science meets compassion.",
      photo: "https://media.licdn.com/dms/image/v2/x/profile-displayphoto-shrink_800_800/0/1",
      verified: true,
      openToWork: false,
      location: { linkedinText: "Los Angeles, California, United States", countryCode: "US" },
      connectionsCount: 261,
      followerCount: 264,
      currentPosition: [{ companyName: "CVS Health" }],
    };
    const r = normalizeResult(item, 0);
    expect(r.kind).toBe("profile");
    expect(r.title).toBe("Towhid Rahman, PharmD");
    expect(r.tagline).toBe("Pharmacology | Medical Science Liasion");
    expect(r.subtitle).toBe("Los Angeles, California, United States");
    expect(r.category).toBe("CVS Health");
    expect(r.url).toBe("https://www.linkedin.com/in/towhid-rahman");
    expect(r.image).toContain("profile-displayphoto");
    expect(r.badges).toEqual(["Vérifié"]);
    expect(r.facts.map((f) => f.label)).toEqual(["Relations", "Abonnés"]);
  });

  it("reconnaît une vidéo TikTok sans texte (titre de repli, image imbriquée)", () => {
    const item = {
      id: "7533731959172861206",
      text: "",
      createTimeISO: "2025-08-01T21:27:45.000Z",
      authorMeta: {
        name: "shaiie_foeva",
        nickName: "Shaiie_Foeva",
        profileUrl: "https://www.tiktok.com/@shaiie_foeva",
      },
      webVideoUrl: "https://www.tiktok.com/@shaiie_foeva/video/7533731959172861206",
      videoMeta: { coverUrl: "https://p16.tiktokcdn-us.com/cover.image" },
      diggCount: 25900,
      shareCount: 352,
      playCount: 573900,
      commentCount: 346,
      isSlideshow: false,
      isPinned: true,
    };
    const r = normalizeResult(item, 0);
    expect(r.kind).toBe("video");
    expect(r.title).toBe("Vidéo de Shaiie_Foeva");
    expect(r.tagline).toBe("@shaiie_foeva");
    expect(r.url).toBe("https://www.tiktok.com/@shaiie_foeva/video/7533731959172861206");
    expect(r.image).toBe("https://p16.tiktokcdn-us.com/cover.image");
    expect(r.date).toBe("2025-08-01T21:27:45.000Z");
    expect(r.facts.map((f) => f.label)).toEqual(["Vues", "J'aime", "Commentaires", "Partages"]);
    expect(r.badges).toEqual(["Épinglée"]);
    expect(r.socials).toEqual([{ network: "tiktok", url: "https://www.tiktok.com/@shaiie_foeva" }]);
    expect(r.emails).toEqual([]);
  });
  
});