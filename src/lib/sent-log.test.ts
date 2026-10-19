import { describe, expect, it } from "vitest";
import { bytesToBase64 } from "./base64";
import { addSentEntry, findPreviousSend, readSent, type SentEntry } from "./sent-log";

const entry = (to: string, sentAt: string): SentEntry => ({ to, subject: "Candidature", company: "Acme", sentAt });

describe("bytesToBase64", () => {
  it("encode correctement, y compris un gros fichier", () => {
    expect(bytesToBase64(new TextEncoder().encode("Hello"))).toBe("SGVsbG8=");
    expect(bytesToBase64(new Uint8Array([0x25, 0x50, 0x44, 0x46]))).toBe("JVBERg==");
    const big = new Uint8Array(100_000).map((_, i) => i % 256);
    const b64 = bytesToBase64(big);
    expect(b64.length).toBe(4 * Math.ceil(big.length / 3));
    expect(new Uint8Array(Buffer.from(b64, "base64"))).toEqual(big); // le serveur décode exactement les mêmes octets
  });
});

describe("journal des envois", () => {
  it("lit de façon tolérante", () => {
    expect(readSent(null)).toEqual([]);
    expect(readSent("pas du json")).toEqual([]);
    expect(readSent(JSON.stringify({ a: 1 }))).toEqual([]);
    const ok = readSent(JSON.stringify([entry("a@b.tg", "2026-01-01"), { to: 42 }]));
    expect(ok).toHaveLength(1);
  });

  it("ajoute en tête et plafonne", () => {
    const list = addSentEntry([entry("a@b.tg", "2026-01-01")], entry("c@d.tg", "2026-01-02"));
    expect(list.map((e) => e.to)).toEqual(["c@d.tg", "a@b.tg"]);
    expect(addSentEntry(list, entry("e@f.tg", "2026-01-03"), 2).map((e) => e.to)).toEqual(["e@f.tg", "c@d.tg"]);
  });

  it("retrouve l'envoi précédent à la même adresse, casse ignorée", () => {
    const list = [entry("Rh@Acme.com", "2026-02-02"), entry("rh@acme.com", "2026-01-01")];
    expect(findPreviousSend(list, " rh@ACME.com ")?.sentAt).toBe("2026-02-02"); // le plus récent
    expect(findPreviousSend(list, "autre@x.tg")).toBeNull();
    expect(findPreviousSend(list, "")).toBeNull();
  });
});