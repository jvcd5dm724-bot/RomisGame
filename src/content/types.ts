/** Hebrew hint text attached to almost every piece of content. */
export interface HebrewHint {
  /** Short Hebrew meaning, shown on hint tap 1. */
  he: string;
  /** One or two simple Hebrew sentences explaining the task, shown on hint tap 2. */
  he_help?: string;
  /** false until a parent has approved this Hebrew text. */
  he_reviewed: boolean;
}

export type WordCategory =
  | "alphabet"
  | "colors"
  | "numbers"
  | "animals"
  | "family"
  | "food"
  | "school"
  | "body"
  | "verbs"
  | "greetings"
  | "toys"
  | "song";

export interface Word extends HebrewHint {
  id: string;
  en: string;
  category: WordCategory;
  /** Emoji shown by default; an "image" field (png/svg path) overrides it later. */
  emoji: string;
  image?: string;
  /** Optional recorded audio file; speechSynthesis is the fallback. */
  audio?: string;
}

interface StepBase extends HebrewHint {
  id: string;
}

/** Teach one new word: hear it, see it, choose it, say it, use it in a sentence. */
export interface IntroStep extends StepBase {
  type: "intro";
  wordId: string;
  sentenceTemplate: string; // e.g. "I see a red ___."
}

/** A clue to decode: pick the right word among decoys. At most 6 English words in the prompt. */
export interface ChoiceStep extends StepBase {
  type: "choice";
  prompt: string;
  wordId: string;
  decoyWordIds: string[];
}

/** The final riddle of the episode, combining words learned earlier in the chain. */
export interface RiddleStep extends StepBase {
  type: "riddle";
  prompt: string;
  wordId: string;
  decoyWordIds: string[];
}

/** Reveals the win + cliffhanger for the next episode. */
export interface UnlockStep extends StepBase {
  type: "unlock";
  rewardText: string;
  cliffhanger: string;
}

/** A short reading passage — practice reading a real sentence, with a dedicated Hebrew translate toggle (separate from the per-word hint). */
export interface ReadingStep extends StepBase {
  type: "reading";
  sentence: string;
  /** Hebrew translation of the whole sentence, revealed by the Translate button. */
  translation: string;
}

/** A graded speaking challenge: she must say the phrase aloud clearly to advance (a gentle fallback appears after repeated tries — never a hard wall). */
export interface RecordingChallengeStep extends StepBase {
  type: "recording-challenge";
  prompt: string;
}

export type EpisodeStep = IntroStep | ChoiceStep | RiddleStep | UnlockStep | ReadingStep | RecordingChallengeStep;

export interface Episode extends HebrewHint {
  id: string;
  order: number;
  title: string;
  steps: EpisodeStep[];
  /** Collectible id awarded on completion, matching an entry in content/collectibles.json. */
  rewardCollectibleId: string;
}

export interface Collectible extends HebrewHint {
  id: string;
  name: string;
  emoji: string;
  slot: "mask" | "costume" | "prop";
}
