import { isMusicMuted } from "./music";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AudioCtx();
  }
  return ctx;
}

/** A bright three-note chime for a correct answer. */
export function playCorrectChime(): void {
  if (isMusicMuted()) return;
  const ac = getCtx();
  const now = ac.currentTime;
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const start = now + i * 0.09;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
    osc.connect(gain).connect(ac.destination);
    osc.start(start);
    osc.stop(start + 0.4);
  });
}

/** A soft, low, non-alarming "not quite" bump — never a harsh buzzer. */
export function playGentleBump(): void {
  if (isMusicMuted()) return;
  const ac = getCtx();
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.15);
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc.connect(gain).connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.25);
}
