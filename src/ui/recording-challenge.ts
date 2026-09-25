import { canRecord, startRecording, type Recorder } from "../audio/record";
import { playCorrectChime, playGentleBump } from "../audio/sfx";

const RECORD_MS = 4000;
const GOOD_LEVEL_THRESHOLD = 0.1;
const MAX_TRIES_BEFORE_FALLBACK = 2;

/**
 * A graded speaking challenge: unlike the practice "Say it" recorder, this
 * one gates onPass() behind a clear-enough recording — but never becomes a
 * hard wall. After a couple of tries a gentle "Continue anyway" appears, so
 * a shy or quiet moment never blocks her progress.
 */
export function createRecordingChallenge(onPass: () => void): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "say-it-wrap";

  const button = document.createElement("button");
  button.className = "say-it-button say-it-button-large";
  button.setAttribute("aria-label", "Record your answer");

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

  const fallback = document.createElement("button");
  fallback.className = "btn-secondary";
  fallback.textContent = "Continue anyway →";
  fallback.hidden = true;
  fallback.addEventListener("click", onPass);

  wrap.appendChild(button);
  wrap.appendChild(feedback);
  wrap.appendChild(fallback);

  if (!canRecord()) {
    // No mic available: never block progress on a device/browser limitation.
    feedback.textContent = "No microphone here — let's continue.";
    feedback.className = "say-it-feedback say-it-quiet";
    window.setTimeout(onPass, 600);
    return wrap;
  }

  let recording = false;
  let rafId: number | null = null;
  let tries = 0;

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
    await recorder.stop();

    const avgLevel = levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : 0;
    if (avgLevel >= GOOD_LEVEL_THRESHOLD) {
      feedback.textContent = "🎉 Great! Case cracked!";
      feedback.className = "say-it-feedback say-it-good celebrate";
      playCorrectChime();
      window.setTimeout(onPass, 700);
    } else {
      tries += 1;
      playGentleBump();
      if (tries >= MAX_TRIES_BEFORE_FALLBACK) {
        feedback.textContent = "🔊 Still quiet — that's okay!";
        feedback.className = "say-it-feedback say-it-quiet";
        fallback.hidden = false;
      } else {
        feedback.textContent = "🔊 Try again, a little louder!";
        feedback.className = "say-it-feedback say-it-quiet";
      }
    }
  }

  button.addEventListener("click", () => {
    if (!recording) begin();
  });

  return wrap;
}
