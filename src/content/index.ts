import type { Collectible, Episode, Word } from "./types";

import colorWords from "./words/colors.json";
import animalWords from "./words/animals.json";
import foodWords from "./words/food.json";
import toyWords from "./words/toys.json";
import episode01 from "./episodes/episode-01.json";
import episode02 from "./episodes/episode-02.json";
import collectiblesJson from "./collectibles.json";

export const words: Word[] = [
  ...(colorWords as Word[]),
  ...(animalWords as Word[]),
  ...(foodWords as Word[]),
  ...(toyWords as Word[]),
];

export const episodes: Episode[] = [episode01 as Episode, episode02 as Episode].sort((a, b) => a.order - b.order);

export const collectibles: Collectible[] = collectiblesJson as Collectible[];

const wordsById = new Map(words.map((w) => [w.id, w]));

export function getWord(id: string): Word {
  const word = wordsById.get(id);
  if (!word) throw new Error(`Unknown word id: ${id}`);
  return word;
}

export function getEpisode(id: string): Episode | undefined {
  return episodes.find((e) => e.id === id);
}
