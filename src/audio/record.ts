/** Record-and-compare speaking practice: record Romi's voice, then play it back next to the model. */
export interface Recorder {
  stop(): Promise<Blob>;
}

export async function startRecording(): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(stream);
  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.start();

  return {
    stop: () =>
      new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
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
