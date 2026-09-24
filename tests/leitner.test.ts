import { describe, expect, it } from "vitest";
import { dueWords, isDue, newWordProgress, reviewWord } from "../src/progress/leitner";

describe("leitner spaced repetition", () => {
  const now = Date.parse("2026-01-01T00:00:00Z");

  it("starts a new word in box 1, due almost immediately", () => {
    const progress = newWordProgress("color-red", now);
    expect(progress.box).toBe(1);
    expect(isDue(progress, now)).toBe(false);
    expect(isDue(progress, now + 11 * 60 * 1000)).toBe(true);
  });

  it("moves a word up a box on a correct answer, further out in time", () => {
    const progress = newWordProgress("color-red", now);
    const next = reviewWord(progress, "correct", now);
    expect(next.box).toBe(2);
    expect(next.dueAt).toBeGreaterThan(progress.dueAt);
  });

  it("drops a word back to box 1 on an incorrect answer", () => {
    let progress = newWordProgress("color-red", now);
    progress = reviewWord(progress, "correct", now);
    progress = reviewWord(progress, "correct", now);
    expect(progress.box).toBe(3);
    progress = reviewWord(progress, "incorrect", now);
    expect(progress.box).toBe(1);
  });

  it("treats a hint as a partial miss: box drops by one and comes back sooner", () => {
    let progress = newWordProgress("color-red", now);
    progress = reviewWord(progress, "correct", now); // box 2
    progress = reviewWord(progress, "correct", now); // box 3
    const beforeHintBox = progress.box;
    progress = reviewWord(progress, "hint", now);
    expect(progress.box).toBe(beforeHintBox - 1);
    expect(progress.hintUses).toBe(1);
  });

  it("never drops below box 1 or climbs above box 5", () => {
    let progress = newWordProgress("color-red", now);
    progress = reviewWord(progress, "incorrect", now);
    expect(progress.box).toBe(1);

    for (let i = 0; i < 10; i++) {
      progress = reviewWord(progress, "correct", now);
    }
    expect(progress.box).toBe(5);
  });

  it("dueWords returns only due items, most overdue first", () => {
    const a = { ...newWordProgress("a", now), dueAt: now + 1000 };
    const b = { ...newWordProgress("b", now), dueAt: now - 5000 };
    const c = { ...newWordProgress("c", now), dueAt: now - 1000 };
    const due = dueWords([a, b, c], now);
    expect(due.map((p) => p.wordId)).toEqual(["b", "c"]);
  });
});
