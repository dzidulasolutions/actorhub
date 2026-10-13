import { describe, expect, it } from "vitest";
import { buildExport, exportFilename, slugify, type ExportMeta } from "./export-json";

const meta: ExportMeta = {
  actorId: "compass~crawler-google-places",
  actorName: "Google Maps",
  runId: "run123",
  datasetId: "ds123",
  startedAt: "2026-10-13T08:00:00.000Z",
  finishedAt: "2026-10-13T08:01:00.000Z",
  input: { searchStringsArray: ["hôtel"] },
};
const items = [{ title: "A", custom: { x: 1 } }, { title: "B" }];
const now = new Date("2026-10-13T10:00:00.000Z");

describe("buildExport", () => {
  it("mode original : renvoie les objets tels quels, sans enveloppe", () => {
    const out = buildExport(items, "original", meta, now);
    expect(out).toBe(items);
  });

  it("mode enveloppé : métadonnées, date, nombre et résultats originaux", () => {
    const out = buildExport(items, "wrapped", meta, now) as Record<string, unknown>;
    expect(out.actorId).toBe("compass~crawler-google-places");
    expect(out.exportedAt).toBe("2026-10-13T10:00:00.000Z");
    expect(out.count).toBe(2);
    expect(out.results).toBe(items); // aucun champ perdu
    expect(out.input).toEqual({ searchStringsArray: ["hôtel"] });
  });
});

describe("noms de fichier", () => {
  it("nettoie les accents et les caractères spéciaux", () => {
    expect(slugify("Google Maps – Hôtels")).toBe("google-maps-hotels");
    expect(slugify("???")).toBe("export");
  });

  it("construit un nom lisible", () => {
    expect(exportFilename("Google Maps", "selected", "wrapped", 2, now)).toBe(
      "actorhub-google-maps-2026-10-13-selection-2-meta.json"
    );
  });
});