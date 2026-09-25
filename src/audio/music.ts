import bgLoopUrl from "../assets/audio/bg-loop.wav";
import { getState, setMusicMuted } from "../state/app-store";

/**
 * iOS Safari ignores HTMLMediaElement.volume set from JS (it's wired to the
 * hardware volume buttons only, and the setter silently no-ops — no error).
 * So volume fades never work on the one device this app targets. Instead we
 * control on/off with the boolean `.muted` property (which iOS *does*
 * respect) and "duck" by pausing/resuming the track around speech, rather
 * than lowering its volume.
 */
let audio: HTMLAudioElement | null = null;
let ducked = false;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(bgLoopUrl);
    audio.loop = true;
    audio.muted = getState().musicMuted;
  }
  return audio;
}

function applyPlaybackState() {
  const el = getAudio();
  el.muted = getState().musicMuted;
  if (ducked || getState().musicMuted) {
    if (!el.paused) el.pause();
  } else if (el.paused) {
    el.play().catch(() => {});
  }
}

/** Call once, inside the first user-gesture handler (iOS only plays audio after a tap). */
export function startMusic(): void {
  applyPlaybackState();
}

export function isMusicMuted(): boolean {
  return getState().musicMuted;
}

export function toggleMusic(): boolean {
  const next = !getState().musicMuted;
  setMusicMuted(next);
  applyPlaybackState();
  return next;
}

/** Briefly pause the music while a voice line plays, so words stay clear. */
export function duckMusic(): void {
  ducked = true;
  applyPlaybackState();
}

export function unduckMusic(): void {
  ducked = false;
  applyPlaybackState();
}
