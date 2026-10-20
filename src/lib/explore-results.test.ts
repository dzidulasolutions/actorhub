import { describe, expect, it } from "vitest";
import { exploreResults, NO_FILTERS, paginate } from "./explore-results";
import { normalizeResult } from "./normalize-results";

const data = [
  normalizeResult(
    {
      title: "Hôtel Le Lac",
      categoryName: "Hôtel",
      totalScore: 4.1,
      reviewsCount: 50,
      emails: ["a@lac.tg"],
    },
    0,
  ),
  normalizeResult(
    {
      title: "Café Zéro",
      totalScore: 4.8,
      reviewsCount: 10,
      phone: "+228 90 00 00 00",
    },
    1,
  ),
  normalizeResult({ title: "Abeille" }, 2),
];

describe("exploreResults", () => {
  it("cherche sans tenir compte des accents ni de la casse", () => {
    expect(
      exploreResults(data, "HOTEL", NO_FILTERS, "default").map((r) => r.index),
    ).toEqual([0]);
  });

  it("filtre sur la présence d'un email", () => {
    const r = exploreResults(
      data,
      "",
      { ...NO_FILTERS, withEmail: true },
      "default",
    );
    expect(r.map((x) => x.index)).toEqual([0]);
  });

  it("trie par note décroissante, valeurs absentes en dernier", () => {
    expect(
      exploreResults(data, "", NO_FILTERS, "rating").map((r) => r.index),
    ).toEqual([1, 0, 2]);
  });

  it("trie par nom", () => {
    expect(
      exploreResults(data, "", NO_FILTERS, "name").map((r) => r.title),
    ).toEqual(["Abeille", "Café Zéro", "Hôtel Le Lac"]);
  });

  it("ne modifie pas le tableau d'origine", () => {
    exploreResults(data, "", NO_FILTERS, "name");
    expect(data.map((r) => r.index)).toEqual([0, 1, 2]);
  });

  it("trie par date, les plus récents d'abord, dates absentes en dernier", () => {
    const withDates = [
      normalizeResult({ title: "Ancien", postedAt: "2023-01-01" }, 0),
      normalizeResult({ title: "Sans date" }, 1),
      normalizeResult({ title: "Récent", postedAt: "2025-06-01" }, 2),
    ];
    expect(
      exploreResults(withDates, "", NO_FILTERS, "date").map((r) => r.title),
    ).toEqual(["Récent", "Ancien", "Sans date"]);
  });

  it("trie par score et filtre les bons scores", () => {
    const items = [
      normalizeResult({ title: "A" }, 0),
      normalizeResult({ title: "B" }, 1),
      normalizeResult({ title: "C" }, 2),
    ];
    const scores = new Map<number, number | null>([
      [0, 30],
      [1, 90],
      [2, null],
    ]);
    const scoreOf = (r: { index: number }) => scores.get(r.index) ?? null;
    expect(
      exploreResults(items, "", NO_FILTERS, "match", scoreOf).map(
        (r) => r.title,
      ),
    ).toEqual(["B", "A", "C"]);
    expect(
      exploreResults(
        items,
        "",
        { ...NO_FILTERS, goodMatch: true },
        "default",
        scoreOf,
      ).map((r) => r.title),
    ).toEqual(["B"]);
  });

  it("filtre les offres analysées", () => {
    const items = [
      normalizeResult({ title: "A" }, 0),
      normalizeResult({ title: "B" }, 1),
    ];
    const isAnalyzed = (r: { index: number }) => r.index === 1;
    expect(
      exploreResults(
        items,
        "",
        { ...NO_FILTERS, analyzed: true },
        "default",
        undefined,
        isAnalyzed,
      ).map((r) => r.title),
    ).toEqual(["B"]);
  });

  it("exclut les fiches déjà contactées", () => {
    const items = [
      normalizeResult({ title: "A" }, 0),
      normalizeResult({ title: "B" }, 1),
    ];
    const isContacted = (r: { index: number }) => r.index === 0;
    expect(
      exploreResults(
        items,
        "",
        { ...NO_FILTERS, notContacted: true },
        "default",
        undefined,
        undefined,
        isContacted,
      ).map((r) => r.title),
    ).toEqual(["B"]);
  });
});

describe("paginate", () => {
  it("découpe et borne la page demandée", () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    expect(paginate(items, 1, 12).items).toHaveLength(12);
    expect(paginate(items, 3, 12).items).toEqual([24]);
    expect(paginate(items, 99, 12).page).toBe(3); // page trop grande → dernière page
    expect(paginate([], 1, 12).pageCount).toBe(1);
  });
});
