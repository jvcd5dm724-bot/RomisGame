/**
 * iOS only plays audio after a user gesture. Call unlockAudio() inside the
 * first tap handler of the app, before anything else tries to speak.
 */
let audioUnlocked = false;

export function unlockAudio(): void {
  if (audioUnlocked || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const silence = new SpeechSynthesisUtterance("");
  silence.volume = 0;
  window.speechSynthesis.speak(silence);
  audioUnlocked = true;
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang === lang) ?? voices.find((v) => v.lang.startsWith(lang.slice(0, 2)));
}

function speak(text: string, lang: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  const voice = pickVoice(lang);
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

/** Speak an English word/sentence. Prefers a recorded audio file when given. */
export function speakEnglish(text: string, audioFile?: string): void {
  if (audioFile) {
    const audio = new Audio(audioFile);
    audio.play().catch(() => speak(text, "en-US"));
    return;
  }
  speak(text, "en-US");
}

/** Speak Hebrew text aloud (hint tap 3), falling back to silence if no he-IL voice exists. */
export function speakHebrew(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const voice = pickVoice("he-IL");
  if (!voice) return; // text-only fallback is handled by the UI showing the Hebrew text
  speak(text, "he-IL");
}
