import bgLoopUrl from "../assets/audio/bg-loop.wav";
import { getState, setMusicMuted } from "../state/app-store";

const NORMAL_VOLUME = 0.35;
const DUCKED_VOLUME = 0.08;
const FADE_MS = 250;

let audio: HTMLAudioElement | null = null;
let ducked = false;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(bgLoopUrl);
    audio.loop = true;
    audio.volume = 0;
  }
  return audio;
}

function fadeTo(target: number) {
  const el = getAudio();
  const start = el.volume;
  const startTime = performance.now();
  function step(now: number) {
    const t = Math.min(1, (now - startTime) / FADE_MS);
    el.volume = start + (target - start) * t;
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function targetVolume(): number {
  if (getState().musicMuted) return 0;
  return ducked ? DUCKED_VOLUME : NORMAL_VOLUME;
}

/** Call once, inside the first user-gesture handler (iOS only plays audio after a tap). */
export function startMusic(): void {
  const el = getAudio();
  el.play()
    .then(() => fadeTo(targetVolume()))
    .catch(() => {
      // Autoplay/gesture requirements not met yet — a later toggleMusic() retry will succeed.
    });
}

export function isMusicMuted(): boolean {
  return getState().musicMuted;
}

export function toggleMusic(): boolean {
  const next = !getState().musicMuted;
  setMusicMuted(next);
  if (!next) getAudio().play().catch(() => {});
  fadeTo(targetVolume());
  return next;
}

/** Softly lower the music while a voice line plays, so words stay clear. */
export function duckMusic(): void {
  ducked = true;
  fadeTo(targetVolume());
}

export function unduckMusic(): void {
  ducked = false;
  fadeTo(targetVolume());
}
