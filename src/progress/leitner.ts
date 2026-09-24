/**
 * Leitner-style spaced repetition. Five boxes; missed words drop to a lower
 * box (shorter interval, come back sooner), correct answers climb to a
 * higher box (longer interval). Using a Hebrew hint counts as a partial
 * miss, so the word still returns sooner even though the child got there.
 */
export type LeitnerBox = 1 | 2 | 3 | 4 | 5;

export type ReviewResult = "correct" | "hint" | "incorrect";

export interface WordProgress {
  wordId: string;
  box: LeitnerBox;
  dueAt: number; // epoch ms
  hintUses: number;
}

/** Interval per box, in milliseconds. Box 1 comes back almost immediately. */
const BOX_INTERVAL_MS: Record<LeitnerBox, number> = {
  1: 10 * 60 * 1000, // 10 minutes
  2: 24 * 60 * 60 * 1000, // 1 day
  3: 3 * 24 * 60 * 60 * 1000, // 3 days
  4: 7 * 24 * 60 * 60 * 1000, // 1 week
  5: 14 * 24 * 60 * 60 * 1000, // 2 weeks
};

export function newWordProgress(wordId: string, now: number): WordProgress {
  return { wordId, box: 1, dueAt: now + BOX_INTERVAL_MS[1], hintUses: 0 };
}

function clampBox(box: number): LeitnerBox {
  return Math.min(5, Math.max(1, box)) as LeitnerBox;
}

export function reviewWord(progress: WordProgress, result: ReviewResult, now: number): WordProgress {
  let box: LeitnerBox;
  switch (result) {
    case "correct":
      box = clampBox(progress.box + 1);
      break;
    case "hint":
      // Partial miss: drop one box so the word is reinforced sooner.
      box = clampBox(progress.box - 1);
      break;
    case "incorrect":
      box = 1;
      break;
  }

  return {
    wordId: progress.wordId,
    box,
    dueAt: now + BOX_INTERVAL_MS[box],
    hintUses: progress.hintUses + (result === "hint" ? 1 : 0),
  };
}

export function isDue(progress: WordProgress, now: number): boolean {
  return progress.dueAt <= now;
}

/** Words due for review, most overdue first — for pulling into new episodes as clues. */
export function dueWords(all: WordProgress[], now: number): WordProgress[] {
  return all.filter((p) => isDue(p, now)).sort((a, b) => a.dueAt - b.dueAt);
}
