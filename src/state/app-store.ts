import { type AppState, loadAppState, saveAppState } from "../progress/storage";
import { newWordProgress, reviewWord, type ReviewResult, type WordProgress } from "../progress/leitner";
import { recordDailyActivity } from "../progress/streak";
import { starsForStep } from "../progress/stars";
import type { EpisodeStep } from "../content/types";

let state: AppState = loadAppState();

export function getState(): AppState {
  return state;
}

function persist() {
  saveAppState(state);
}

export function reviewWordResult(wordId: string, result: ReviewResult, now: number): WordProgress {
  const existing: WordProgress = state.wordProgress[wordId] ?? newWordProgress(wordId, now);
  const updated = reviewWord(existing, result, now);
  state = { ...state, wordProgress: { ...state.wordProgress, [wordId]: updated } };
  if (result === "hint") {
    state.hintLog[wordId] = (state.hintLog[wordId] ?? 0) + 1;
  }
  persist();
  return updated;
}

export function awardStars(stepType: EpisodeStep["type"], result: ReviewResult): number {
  const stars = starsForStep(stepType, result);
  state = { ...state, stars: state.stars + stars };
  persist();
  return stars;
}

export function completeEpisode(episodeId: string, rewardCollectibleId: string, today: string): void {
  state = {
    ...state,
    episodeProgress: {
      ...state.episodeProgress,
      [episodeId]: { completed: true, currentStepIndex: -1 },
    },
    collectiblesEarned: state.collectiblesEarned.includes(rewardCollectibleId)
      ? state.collectiblesEarned
      : [...state.collectiblesEarned, rewardCollectibleId],
    streak: recordDailyActivity(state.streak, today),
  };
  persist();
}

export function setEpisodeStepIndex(episodeId: string, stepIndex: number): void {
  state = {
    ...state,
    episodeProgress: {
      ...state.episodeProgress,
      [episodeId]: { completed: false, currentStepIndex: stepIndex },
    },
  };
  persist();
}

export function setHintMode(mode: AppState["hintMode"]): void {
  state = { ...state, hintMode: mode };
  persist();
}

export function approveHintOverride(contentId: string, he?: string, heHelp?: string): void {
  state = {
    ...state,
    hintOverrides: {
      ...state.hintOverrides,
      [contentId]: { ...(he !== undefined ? { he } : {}), ...(heHelp !== undefined ? { he_help: heHelp } : {}), he_reviewed: true },
    },
  };
  persist();
}

export function setMusicMuted(muted: boolean): void {
  state = { ...state, musicMuted: muted };
  persist();
}

export function addSongWord(en: string, he: string): void {
  const id = `song-${en.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  state = {
    ...state,
    songWords: [...state.songWords.filter((w) => w.id !== id), { id, en, he, he_reviewed: false }],
  };
  persist();
}
