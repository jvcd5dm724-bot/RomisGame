import type { Word } from "../content/types";
import { contentImages } from "../content/images";

/** Renders a word's picture: a real illustration when one exists, else the emoji. */
export function renderWordVisual(word: Word, className: string): HTMLElement {
  const src = word.image ? contentImages[word.image] : undefined;
  if (src) {
    const img = document.createElement("img");
    img.src = src;
    img.alt = word.en;
    img.className = className;
    return img;
  }
  const el = document.createElement("div");
  el.className = className;
  el.textContent = word.emoji;
  return el;
}
