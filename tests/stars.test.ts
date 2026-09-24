import { describe, expect, it } from "vitest";
import { starsForStep } from "../src/progress/stars";

describe("stars", () => {
  it("awards full stars on a correct answer", () => {
    expect(starsForStep("riddle", "correct")).toBe(2);
    expect(starsForStep("unlock", "correct")).toBe(3);
  });

  it("still awards at least one star when a hint was used", () => {
    expect(starsForStep("intro", "hint")).toBeGreaterThanOrEqual(1);
    expect(starsForStep("riddle", "hint")).toBeLessThan(starsForStep("riddle", "correct"));
  });
});
