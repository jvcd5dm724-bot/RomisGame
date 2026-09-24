import "./styles/fonts.css";
import "./styles/theme.css";
import "./styles/home.css";
import "./styles/mystery.css";
import "./styles/parent.css";
import { registerSW } from "virtual:pwa-register";

import { unlockAudio } from "./audio/speech";
import { renderHomeScreen } from "./ui/home-screen";
import { renderMysteryPlayer } from "./ui/mystery-player";
import { renderParentScreen } from "./ui/parent-screen";
import { episodes } from "./content/index";
import { getState } from "./state/app-store";

registerSW({ immediate: true });

document.addEventListener(
  "pointerdown",
  () => {
    unlockAudio();
  },
  { once: true },
);

function navigate(hash: string) {
  if (location.hash === hash) {
    render();
  } else {
    location.hash = hash;
  }
}

function currentEpisode() {
  const state = getState();
  const next = episodes.find((e) => !state.episodeProgress[e.id]?.completed);
  return next ?? episodes[0]!;
}

function render() {
  const app = document.getElementById("app");
  if (!app) return;
  app.innerHTML = "";

  const hash = location.hash || "#/";
  if (hash.startsWith("#/mystery")) {
    app.appendChild(renderMysteryPlayer(currentEpisode(), navigate));
  } else if (hash.startsWith("#/parent")) {
    app.appendChild(renderParentScreen(navigate));
  } else {
    app.appendChild(renderHomeScreen(navigate));
  }
}

window.addEventListener("hashchange", render);
render();
