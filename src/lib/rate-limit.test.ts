import { describe, expect, it } from "vitest";
import { rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  it("autorise jusqu'à la limite puis bloque, et indique le délai", () => {
    const t = 1_000_000;
    expect(rateLimit("test-a", 2, 60_000, t).ok).toBe(true);
    expect(rateLimit("test-a", 2, 60_000, t + 1).ok).toBe(true);
    const blocked = rateLimit("test-a", 2, 60_000, t + 2);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterS).toBeGreaterThan(0);
  });

  it("repart à zéro après la fenêtre et sépare les clés", () => {
    const t = 2_000_000;
    rateLimit("test-b", 1, 1000, t);
    expect(rateLimit("test-b", 1, 1000, t + 10).ok).toBe(false);
    expect(rateLimit("test-b", 1, 1000, t + 1001).ok).toBe(true); // nouvelle fenêtre
    expect(rateLimit("test-c", 1, 1000, t).ok).toBe(true); // autre clé
  });
});