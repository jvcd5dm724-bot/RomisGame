import type { WordProgress } from "./leitner";
import type { StreakState } from "./streak";
import { initialStreakState } from "./streak";

export type HintMode = "always" | "after-first-try" | "off";

export interface HintOverride {
  he?: string;
  he_help?: string;
  he_reviewed: boolean;
}

export interface EpisodeProgress {
  completed: boolean;
  currentStepIndex: number;
}

export interface AppState {
  streak: StreakState;
  stars: number;
  wordProgress: Record<string, WordProgress>;
  episodeProgress: Record<string, EpisodeProgress>;
  collectiblesEarned: string[];
  hintMode: HintMode;
  /** Per-word count of hint taps, so the parent screen can see who needs more help. */
  hintLog: Record<string, number>;
  /** Parent-approved edits/approvals for content Hebrew text, applied on top of the bundled JSON. */
  hintOverrides: Record<string, HintOverride>;
  /** Extra vocabulary the parent adds from songs/shows Romi loves — words only, never lyrics. */
  songWords: Array<{ id: string; en: string; he: string; he_reviewed: boolean }>;
}

export function defaultAppState(): AppState {
  return {
    streak: initialStreakState,
    stars: 0,
    wordProgress: {},
    episodeProgress: {},
    collectiblesEarned: [],
    hintMode: "always",
    hintLog: {},
    hintOverrides: {},
    songWords: [],
  };
}

const STORAGE_KEY = "romi-progress-v1";

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAppState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return { ...defaultAppState(), ...parsed };
  } catch {
    return defaultAppState();
  }
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable (e.g. private browsing) — fail silently,
    // the session still works, just without persistence.
  }
}
