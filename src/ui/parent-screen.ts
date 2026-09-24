import { words, episodes, collectibles } from "../content/index";
import { withHintOverride } from "../content/overrides";
import { getState, setHintMode, approveHintOverride, addSongWord } from "../state/app-store";
import type { HebrewHint } from "../content/types";
import { countRecordings, deleteAllRecordings } from "../audio/recordings";
import type { HintMode } from "../progress/storage";
import { createHomeButton } from "./home-button";

interface ReviewableItem {
  id: string;
  kind: string;
  label: string;
  hint: HebrewHint;
}

function collectReviewables(): ReviewableItem[] {
  const items: ReviewableItem[] = [];
  for (const w of words) items.push({ id: w.id, kind: "word", label: w.en, hint: withHintOverride(w) });
  for (const c of collectibles) items.push({ id: c.id, kind: "collectible", label: c.name, hint: withHintOverride(c) });
  for (const e of episodes) {
    items.push({ id: e.id, kind: "episode", label: e.title, hint: withHintOverride(e) });
    for (const s of e.steps) {
      items.push({ id: s.id, kind: `${e.id} step`, label: s.id, hint: withHintOverride(s) });
    }
  }
  return items.filter((i) => !i.hint.he_reviewed);
}

export function renderParentScreen(navigate: (hash: string) => void): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "screen-shell";
  wrapper.appendChild(createHomeButton(navigate));

  const root = document.createElement("div");
  root.className = "parent-screen";
  wrapper.appendChild(root);

  const title = document.createElement("h1");
  title.textContent = "Parent screen";
  root.appendChild(title);

  // --- Hint mode ---
  const hintSection = document.createElement("section");
  hintSection.className = "parent-section";
  hintSection.innerHTML = `<h2>Hebrew hint mode</h2>`;
  const modes: { value: HintMode; label: string }[] = [
    { value: "always", label: "Always available (default)" },
    { value: "after-first-try", label: "After her first try" },
    { value: "off", label: "Off" },
  ];
  const currentMode = getState().hintMode;
  for (const m of modes) {
    const label = document.createElement("label");
    label.className = "radio-row";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "hint-mode";
    input.value = m.value;
    input.checked = currentMode === m.value;
    input.addEventListener("change", () => setHintMode(m.value));
    label.appendChild(input);
    label.appendChild(document.createTextNode(" " + m.label));
    hintSection.appendChild(label);
  }
  root.appendChild(hintSection);

  // --- Words needing hints ---
  const hintLog = getState().hintLog;
  const needHelp = words
    .map((w) => ({ word: w, count: hintLog[w.id] ?? 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);

  const helpSection = document.createElement("section");
  helpSection.className = "parent-section";
  helpSection.innerHTML = `<h2>Words that still need hints</h2>`;
  if (needHelp.length === 0) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "No hint usage logged yet.";
    helpSection.appendChild(p);
  } else {
    for (const { word, count } of needHelp) {
      const row = document.createElement("div");
      row.className = "list-row";
      row.textContent = `${word.emoji} ${word.en} — used ${count}x`;
      helpSection.appendChild(row);
    }
  }
  root.appendChild(helpSection);

  // --- Unreviewed hints ---
  const reviewSection = document.createElement("section");
  reviewSection.className = "parent-section";
  reviewSection.innerHTML = `<h2>Unreviewed Hebrew hints</h2>`;
  const reviewables = collectReviewables();
  if (reviewables.length === 0) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "Everything is reviewed. 🎉";
    reviewSection.appendChild(p);
  } else {
    for (const item of reviewables) {
      const row = document.createElement("div");
      row.className = "review-row";

      const heading = document.createElement("div");
      heading.textContent = `[${item.kind}] ${item.label}`;
      heading.className = "review-heading";
      row.appendChild(heading);

      const heInput = document.createElement("input");
      heInput.setAttribute("lang", "he");
      heInput.setAttribute("dir", "rtl");
      heInput.value = item.hint.he;
      row.appendChild(heInput);

      const helpInput = document.createElement("textarea");
      helpInput.setAttribute("lang", "he");
      helpInput.setAttribute("dir", "rtl");
      helpInput.value = item.hint.he_help ?? "";
      helpInput.placeholder = "he_help";
      row.appendChild(helpInput);

      const approveBtn = document.createElement("button");
      approveBtn.className = "btn-secondary";
      approveBtn.textContent = "Approve";
      approveBtn.addEventListener("click", () => {
        approveHintOverride(item.id, heInput.value, helpInput.value || undefined);
        row.remove();
      });
      row.appendChild(approveBtn);

      reviewSection.appendChild(row);
    }
  }
  root.appendChild(reviewSection);

  // --- Song words ---
  const songSection = document.createElement("section");
  songSection.className = "parent-section";
  songSection.innerHTML = `<h2>Add a song/show word</h2><p class="muted">Words only — never lyrics.</p>`;
  const enInput = document.createElement("input");
  enInput.placeholder = "English word";
  const heInput = document.createElement("input");
  heInput.setAttribute("lang", "he");
  heInput.setAttribute("dir", "rtl");
  heInput.placeholder = "פירוש בעברית";
  const addBtn = document.createElement("button");
  addBtn.className = "btn-secondary";
  addBtn.textContent = "Add word";
  addBtn.addEventListener("click", () => {
    if (!enInput.value.trim() || !heInput.value.trim()) return;
    addSongWord(enInput.value.trim(), heInput.value.trim());
    enInput.value = "";
    heInput.value = "";
    renderSongList();
  });
  songSection.appendChild(enInput);
  songSection.appendChild(heInput);
  songSection.appendChild(addBtn);
  const songList = document.createElement("div");
  songSection.appendChild(songList);
  function renderSongList() {
    songList.innerHTML = "";
    for (const w of getState().songWords) {
      const row = document.createElement("div");
      row.className = "list-row";
      row.textContent = `${w.en} — ${w.he}`;
      songList.appendChild(row);
    }
  }
  renderSongList();
  root.appendChild(songSection);

  // --- Recordings / privacy ---
  const recSection = document.createElement("section");
  recSection.className = "parent-section";
  recSection.innerHTML = `<h2>Her voice recordings</h2>`;
  const recCount = document.createElement("p");
  recCount.className = "muted";
  recCount.textContent = "Loading…";
  recSection.appendChild(recCount);
  countRecordings().then((n) => (recCount.textContent = `${n} recording(s) stored on this device.`));
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn-secondary";
  deleteBtn.textContent = "Delete all recordings";
  deleteBtn.addEventListener("click", async () => {
    await deleteAllRecordings();
    recCount.textContent = "0 recording(s) stored on this device.";
  });
  recSection.appendChild(deleteBtn);
  root.appendChild(recSection);

  const backBtn = document.createElement("button");
  backBtn.className = "btn-primary";
  backBtn.textContent = "Back to TV";
  backBtn.addEventListener("click", () => navigate("#/"));
  root.appendChild(backBtn);

  return wrapper;
}
