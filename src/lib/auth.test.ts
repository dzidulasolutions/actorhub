import { describe, expect, it } from "vitest";
import { createSessionToken, safeEqual, SESSION_MAX_AGE_S, verifySessionToken } from "./auth";

const secret = "s".repeat(40);
const now = 1_800_000_000_000;

describe("session", () => {
  it("accepte un jeton valide", async () => {
    const token = await createSessionToken(secret, now);
    expect(await verifySessionToken(token, secret, now + 1000)).toBe(true);
  });

  it("refuse un jeton expiré", async () => {
    const token = await createSessionToken(secret, now);
    expect(await verifySessionToken(token, secret, now + (SESSION_MAX_AGE_S + 1) * 1000)).toBe(false);
  });

  it("refuse un jeton modifié, d'un autre secret, vide ou absurde", async () => {
    const token = await createSessionToken(secret, now);
    const [v, exp, sig] = token.split(".");
    expect(await verifySessionToken(`${v}.${Number(exp) + 100000}.${sig}`, secret, now)).toBe(false);
    expect(await verifySessionToken(token, "autre".repeat(10), now)).toBe(false);
    expect(await verifySessionToken(undefined, secret, now)).toBe(false);
    expect(await verifySessionToken("abc", secret, now)).toBe(false);
  });
});

describe("safeEqual", () => {
  it("compare deux textes", () => {
    expect(safeEqual("code-secret", "code-secret")).toBe(true);
    expect(safeEqual("code-secret", "code-secreT")).toBe(false);
    expect(safeEqual("court", "plus long")).toBe(false);
  });
});