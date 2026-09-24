import type { HebrewHint } from "./types";
import { words, episodes, collectibles } from "./index";

export interface ContentIssue {
  kind: string;
  id: string;
  problem: string;
}

function checkHint(kind: string, id: string, hint: HebrewHint, requireHelp: boolean): ContentIssue[] {
  const issues: ContentIssue[] = [];
  if (!hint.he || hint.he.trim() === "") {
    issues.push({ kind, id, problem: 'missing "he"' });
  }
  if (requireHelp && (!hint.he_help || hint.he_help.trim() === "")) {
    issues.push({ kind, id, problem: 'missing "he_help"' });
  }
  return issues;
}

/**
 * Instructions and riddles (episode steps) require he_help; plain vocabulary
 * words and collectibles only require the short "he" meaning.
 */
export function validateContent(): ContentIssue[] {
  const issues: ContentIssue[] = [];

  for (const word of words) {
    issues.push(...checkHint("word", word.id, word, false));
  }

  for (const collectible of collectibles) {
    issues.push(...checkHint("collectible", collectible.id, collectible, false));
  }

  for (const episode of episodes) {
    issues.push(...checkHint("episode", episode.id, episode, true));
    for (const step of episode.steps) {
      issues.push(...checkHint(`${episode.id} step`, step.id, step, true));
    }
  }

  return issues;
}
