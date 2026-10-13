// src/lib/parse-import.test.ts
import { describe, expect, it } from "vitest";
import { MAX_IMPORT_ITEMS, parseExport } from "./parse-import";

const id = () => "import-test";
const items = [{ title: "A", custom: { x: 1 } }, { title: "B" }];

describe("parseExport", () => {
  it("lit un tableau d'objets (données originales)", () => {
    const r = parseExport(JSON.stringify(items), "google-maps-hotels.json", id);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.record.id).toBe("import-test");
    expect(r.record.actorName).toBe("google-maps-hotels"); // nom du fichier à défaut de métadonnées
    expect(r.record.items).toEqual(items);
    expect(r.record.status).toBe("succeeded");
  });

  it("lit un export enveloppé et garde ses métadonnées", () => {
    const wrapped = {
      actorId: "compass~crawler-google-places",
      actorName: "Google Maps",
      input: { searchStringsArray: ["hôtel"] },
      startedAt: "2026-10-13T08:00:00.000Z",
      exportedAt: "2026-10-13T10:00:00.000Z",
      count: 2,
      results: items,
    };
    const r = parseExport(JSON.stringify(wrapped), "x.json", id);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.record.actorName).toBe("Google Maps");
    expect(r.record.apifyId).toBe("compass~crawler-google-places");
    expect(r.record.input).toEqual({ searchStringsArray: ["hôtel"] });
    expect(r.record.startedAt).toBe("2026-10-13T08:00:00.000Z");
    expect(r.record.items).toEqual(items); // aucun champ perdu
  });

  it("ignore des métadonnées invalides sans échouer", () => {
    const r = parseExport(JSON.stringify({ actorName: 42, startedAt: "pas une date", input: [1], results: items }), "x.json", id);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.record.actorName).toBe("x");
    expect(r.record.startedAt).toBeNull();
    expect(r.record.input).toEqual({});
  });

  it("accepte le format { items } de la route dataset", () => {
    expect(parseExport(JSON.stringify({ items, total: 2 }), "x.json", id).ok).toBe(true);
  });

  it("refuse un JSON invalide, un format inconnu et un fichier vide", () => {
    expect(parseExport("pas du json", "x.json", id).ok).toBe(false);
    expect(parseExport("{}", "x.json", id).ok).toBe(false);
    expect(parseExport('"texte"', "x.json", id).ok).toBe(false);
    expect(parseExport("[]", "x.json", id).ok).toBe(false);
  });

  it("refuse un fichier avec trop de résultats", () => {
    const big = JSON.stringify(Array.from({ length: MAX_IMPORT_ITEMS + 1 }, () => ({})));
    expect(parseExport(big, "x.json", id).ok).toBe(false);
  });
});