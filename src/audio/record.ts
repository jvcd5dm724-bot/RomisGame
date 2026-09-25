/** Record-and-compare speaking practice: record Romi's voice, then play it back next to the model. */
export interface Recorder {
  stop(): Promise<Blob>;
  /** Current mic input level, roughly 0 (silence) to 1 (loud), for a live volume meter. */
  getLevel(): number;
}

export async function startRecording(): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(stream);
  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.start();

  const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtx();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);
  const data = new Uint8Array(analyser.frequencyBinCount);

  function getLevel(): number {
    analyser.getByteTimeDomainData(data);
    let sumSquares = 0;
    for (let i = 0; i < data.length; i++) {
      const deviation = (data[i] ?? 128) - 128;
      sumSquares += deviation * deviation;
    }
    const rms = Math.sqrt(sumSquares / data.length);
    return Math.min(1, rms / 45);
  }

  return {
    getLevel,
    stop: () =>
      new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          audioCtx.close().catch(() => {});
          resolve(new Blob(chunks, { type: recorder.mimeType }));
        };
        recorder.stop();
      }),
  };
}

export function canRecord(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices && typeof MediaRecorder !== "undefined";
}

export function playBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.addEventListener("ended", () => URL.revokeObjectURL(url));
  audio.play().catch(() => URL.revokeObjectURL(url));
}
