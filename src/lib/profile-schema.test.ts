import { describe, expect, it } from "vitest";
import { EMPTY_PROFILE } from "../types/profile";
import { mergeTags, profileReadiness, profileSchema, readProfile, servicesReadiness } from "./profile-schema";

describe("mergeTags", () => {
  it("sépare par virgule, point-virgule ou retour à la ligne, sans doublons", () => {
    expect(mergeTags(["React"], "react, Node.js;NestJS\nFlutter, ")).toEqual([
      "React", "Node.js", "NestJS", "Flutter",
    ]);
  });

  it("respecte le maximum et tronque les étiquettes trop longues", () => {
    expect(mergeTags([], "a,b,c,d", 2)).toEqual(["a", "b"]);
    expect(mergeTags([], "x".repeat(100))[0]).toHaveLength(60);
  });
});

describe("readProfile", () => {
  it("renvoie le profil vide si rien n'est stocké ou si les données sont corrompues", () => {
    expect(readProfile(null)).toBe(EMPTY_PROFILE);
    expect(readProfile("pas du json")).toBe(EMPTY_PROFILE);
    expect(readProfile(JSON.stringify({ skills: "pas une liste" }))).toBe(EMPTY_PROFILE);
  });

  it("complète les champs manquants avec les valeurs par défaut", () => {
    const p = readProfile(JSON.stringify({ fullName: "Gamatho", skills: ["React"] }));
    expect(p.fullName).toBe("Gamatho");
    expect(p.skills).toEqual(["React"]);
    expect(p.targetRoles).toEqual([]);
    expect(p.cvFileName).toBeNull();
  });
});

describe("profileSchema", () => {
  it("refuse un email invalide mais accepte un email vide", () => {
    expect(profileSchema.safeParse({ ...EMPTY_PROFILE, email: "pas-un-email" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...EMPTY_PROFILE, email: "" }).success).toBe(true);
    expect(profileSchema.safeParse({ ...EMPTY_PROFILE, email: "moi@exemple.tg" }).success).toBe(true);
  });
});

describe("profileReadiness", () => {
  it("n'est prêt que si les quatre conditions sont remplies", () => {
    expect(profileReadiness(EMPTY_PROFILE).ready).toBe(false);
    const full = {
      ...EMPTY_PROFILE,
      fullName: "Gamatho",
      skills: ["React", "Node.js", "NestJS"],
      targetRoles: ["Développeur"],
      cvText: "x".repeat(300),
    };
    expect(profileReadiness(full).ready).toBe(true);
    expect(profileReadiness({ ...full, skills: ["React"] }).ready).toBe(false);
  });
});

describe("services et lien de réalisations", () => {
  const ok = { ...EMPTY_PROFILE, website: "https://gamatho.dev", services: [{ name: "Site vitrine", description: "Un site clair." }] };

  it("valide les services et le lien", () => {
    expect(profileSchema.safeParse(ok).success).toBe(true);
    expect(profileSchema.safeParse({ ...ok, website: "gamatho.dev" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...ok, website: "javascript:alert(1)" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...ok, services: [{ name: "  ", description: "x" }] }).success).toBe(false);
    const tooMany = Array.from({ length: 11 }, () => ({ name: "a", description: "" }));
    expect(profileSchema.safeParse({ ...ok, services: tooMany }).success).toBe(false);
  });

  it("complète un ancien profil enregistré sans ces champs", () => {
    const p = readProfile(JSON.stringify({ fullName: "Gamatho" }));
    expect(p.services).toEqual([]);
    expect(p.website).toBe("");
  });

  it("servicesReadiness exige un nom, un service décrit et un contact", () => {
    expect(servicesReadiness(EMPTY_PROFILE).ready).toBe(false);
    const ready = { ...ok, fullName: "Gamatho", email: "moi@exemple.tg" };
    expect(servicesReadiness(ready).ready).toBe(true);
    expect(servicesReadiness({ ...ready, services: [{ name: "Site", description: "" }] }).ready).toBe(false);
  });
});