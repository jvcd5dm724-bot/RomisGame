import { getState } from "../state/app-store";
import { episodes } from "../content/index";
import { createHoldButton } from "./hold-button";
import { contentImages } from "../content/images";

interface Channel {
  id: string;
  name: string;
  he: string;
  emoji: string;
  active: boolean;
}

const CHANNELS: Channel[] = [
  { id: "mystery", name: "Mystery Channel", he: "ערוץ התעלומות", emoji: "🕵️", active: true },
  { id: "stage", name: "Stage Channel", he: "ערוץ הבמה", emoji: "🎤", active: false },
  { id: "move", name: "Move Channel", he: "ערוץ התנועה", emoji: "💃", active: false },
  { id: "art", name: "Art Channel", he: "ערוץ האמנות", emoji: "🎨", active: false },
  { id: "journal", name: "Story Journal", he: "יומן הסיפורים", emoji: "📓", active: false },
];

export function renderHomeScreen(navigate: (hash: string) => void): HTMLElement {
  const root = document.createElement("div");
  root.className = "home-screen";

  const state = getState();

  const header = document.createElement("div");
  header.className = "home-header";
  header.innerHTML = `
    <div class="stat">⭐ ${state.stars}</div>
    <div class="stat">🔥 ${state.streak.currentStreak}</div>
  `;
  root.appendChild(header);

  const tv = document.createElement("div");
  tv.className = "tv-frame";

  const guide = document.createElement("div");
  guide.className = "guide-line";
  const guideAvatar = document.createElement("img");
  guideAvatar.className = "guide-avatar";
  guideAvatar.src = contentImages.raccoon!;
  guideAvatar.alt = "Raccoon detective";
  guide.appendChild(guideAvatar);
  const guideDetective = document.createElement("span");
  guideDetective.textContent = "🕵️";
  guide.appendChild(guideDetective);
  const guideText = document.createElement("span");
  guideText.textContent = "Pick a channel!";
  guide.appendChild(guideText);
  tv.appendChild(guide);

  const grid = document.createElement("div");
  grid.className = "channel-grid";

  for (const channel of CHANNELS) {
    const card = document.createElement("button");
    card.className = channel.active ? "channel-card channel-active" : "channel-card channel-static";
    card.setAttribute("aria-label", channel.name);

    const emoji = document.createElement("div");
    emoji.className = "channel-emoji";
    emoji.textContent = channel.emoji;
    card.appendChild(emoji);

    const label = document.createElement("div");
    label.className = "channel-label";
    label.textContent = channel.name;
    card.appendChild(label);

    if (!channel.active) {
      const staticOverlay = document.createElement("div");
      staticOverlay.className = "tv-static";
      card.appendChild(staticOverlay);
      const soon = document.createElement("div");
      soon.className = "channel-soon";
      soon.textContent = "Coming soon";
      card.appendChild(soon);
    }

    card.addEventListener("click", () => {
      if (channel.active) {
        navigate("#/mystery");
      } else {
        card.classList.add("static-flicker");
        window.setTimeout(() => card.classList.remove("static-flicker"), 500);
      }
    });

    grid.appendChild(card);
  }

  tv.appendChild(grid);
  root.appendChild(tv);

  const episodeCount = episodes.length;
  const completedCount = Object.values(state.episodeProgress).filter((p) => p.completed).length;
  const progressLine = document.createElement("div");
  progressLine.className = "progress-line";
  progressLine.textContent = `Episodes solved: ${completedCount} / ${episodeCount}`;
  root.appendChild(progressLine);

  const parentGate = createHoldButton({
    className: "parent-gate-link",
    label: "⚙️",
    ariaLabel: "Parent settings — hold for 3 seconds",
    holdMs: 3000,
    onComplete: () => navigate("#/parent"),
  });
  root.appendChild(parentGate);

  return root;
}
