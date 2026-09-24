import type { Word } from "../content/types";
import { canRecord, playBlob, startRecording, type Recorder } from "../audio/record";
import { saveRecording } from "../audio/recordings";

const RECORD_MS = 4000;
const GOOD_LEVEL_THRESHOLD = 0.1;

/**
 * The "Say it" recording widget: tap to start, a countdown ring shows how
 * long she has to speak, a live volume meter shows the mic is picking her
 * up, and it auto-stops and gives a friendly clear/quiet signal — not a
 * pronunciation grade (that's not something we can honestly assess
 * on-device), just "did the mic hear you".
 */
export function createSayItRecorder(word: Word): HTMLElement | null {
  if (!canRecord()) return null;

  const wrap = document.createElement("div");
  wrap.className = "say-it-wrap";

  const button = document.createElement("button");
  button.className = "say-it-button";
  button.setAttribute("aria-label", "Say it — record your voice");

  const ring = document.createElement("div");
  ring.className = "say-it-ring";
  button.appendChild(ring);

  const meter = document.createElement("div");
  meter.className = "say-it-meter";
  button.appendChild(meter);

  const icon = document.createElement("span");
  icon.className = "say-it-icon";
  icon.textContent = "🎤";
  button.appendChild(icon);

  const feedback = document.createElement("div");
  feedback.className = "say-it-feedback";

  wrap.appendChild(button);
  wrap.appendChild(feedback);

  let recording = false;
  let rafId: number | null = null;

  async function begin() {
    if (recording) return;
    recording = true;
    feedback.textContent = "";
    feedback.className = "say-it-feedback";
    button.classList.add("recording");
    icon.textContent = "⏺";

    let recorder: Recorder | null = null;
    try {
      recorder = await startRecording();
    } catch {
      recording = false;
      button.classList.remove("recording");
      icon.textContent = "🎤";
      feedback.textContent = "Couldn't hear the microphone. 🎤";
      feedback.className = "say-it-feedback say-it-quiet";
      return;
    }

    const startTime = performance.now();
    const levels: number[] = [];

    function frame(now: number) {
      if (!recorder) return;
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / RECORD_MS);
      ring.style.setProperty("--hold-progress", String(1 - progress));
      const level = recorder.getLevel();
      levels.push(level);
      meter.style.setProperty("--level", String(level));
      if (progress >= 1) {
        finish(recorder, levels);
        return;
      }
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);
  }

  async function finish(recorder: Recorder, levels: number[]) {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    recording = false;
    button.classList.remove("recording");
    icon.textContent = "🎤";
    ring.style.setProperty("--hold-progress", "0");
    meter.style.setProperty("--level", "0");

    const blob = await recorder.stop();
    await saveRecording(word.id, blob);
    playBlob(blob);

    const avgLevel = levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : 0;
    if (avgLevel >= GOOD_LEVEL_THRESHOLD) {
      feedback.textContent = "🎉 Nice and clear!";
      feedback.className = "say-it-feedback say-it-good celebrate";
    } else {
      feedback.textContent = "🔊 Try again, a little louder!";
      feedback.className = "say-it-feedback say-it-quiet";
    }
  }

  button.addEventListener("click", () => {
    if (!recording) begin();
  });

  return wrap;
}
