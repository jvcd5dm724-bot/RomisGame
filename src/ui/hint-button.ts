import type { HebrewHint } from "../content/types";
import { speakHebrew } from "../audio/speech";
import type { HintMode } from "../progress/storage";

export interface HintButtonHandle {
  el: HTMLElement;
  /** Reveal the panel programmatically, e.g. right after a wrong answer in "after-first-try" mode. */
  reveal(): void;
  destroy(): void;
}

/**
 * The one hint button every activity screen has, always bottom-corner,
 * always 56px+. Tap 1: Hebrew meaning. Tap 2: Hebrew help. Tap 3: speak it.
 * Tap 4: closes and the cycle restarts.
 */
export function createHintButton(
  hint: HebrewHint,
  mode: HintMode,
  onFirstReveal: () => void,
): HintButtonHandle {
  const wrap = document.createElement("div");
  if (mode === "off") {
    return { el: wrap, reveal: () => {}, destroy: () => {} };
  }

  const button = document.createElement("button");
  button.className = "hint-button";
  button.setAttribute("aria-label", "עזרה בעברית");
  button.textContent = "❓";

  // The panel itself stays in the page's LTR flow so its fixed position
  // (anchored to the hint button) doesn't flip; only the Hebrew text inside
  // it is RTL.
  const panel = document.createElement("div");
  panel.className = "hint-panel";
  panel.hidden = true;

  let tap = 0;
  let everRevealed = false;
  let hiddenUntilFirstTry = mode === "after-first-try";

  button.hidden = hiddenUntilFirstTry;

  function renderPanel() {
    panel.innerHTML = "";
    if (tap === 0) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    const bdi = document.createElement("bdi");
    bdi.setAttribute("lang", "he");
    bdi.setAttribute("dir", "rtl");
    if (tap === 1) {
      bdi.textContent = hint.he;
    } else if (tap === 2) {
      bdi.textContent = hint.he_help ?? hint.he;
    } else {
      bdi.textContent = hint.he_help ?? hint.he;
      speakHebrew(hint.he_help ?? hint.he);
    }
    panel.appendChild(bdi);
  }

  button.addEventListener("click", () => {
    tap = (tap + 1) % 4;
    if (tap === 1 && !everRevealed) {
      everRevealed = true;
      onFirstReveal();
    }
    renderPanel();
  });

  wrap.appendChild(panel);
  wrap.appendChild(button);

  return {
    el: wrap,
    reveal: () => {
      if (hiddenUntilFirstTry) {
        hiddenUntilFirstTry = false;
        button.hidden = false;
      }
    },
    destroy: () => {
      wrap.remove();
    },
  };
}
