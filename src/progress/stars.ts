import type { EpisodeStep } from "../content/types";
import type { ReviewResult } from "./leitner";

/** Stars (XP) awarded for finishing a step, before any hint penalty. */
const BASE_STARS: Record<EpisodeStep["type"], number> = {
  intro: 1,
  choice: 1,
  riddle: 2,
  unlock: 3,
};

export function starsForStep(stepType: EpisodeStep["type"], result: ReviewResult): number {
  const base = BASE_STARS[stepType];
  // Getting there with a hint still earns something — never shame a hint.
  return result === "hint" ? Math.max(1, Math.floor(base / 2)) : base;
}
