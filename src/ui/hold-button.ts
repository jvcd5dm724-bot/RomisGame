export interface HoldButtonOptions {
  className: string;
  label: string;
  ariaLabel: string;
  holdMs: number;
  onComplete: () => void;
}

/**
 * A press-and-hold button with a visible filling ring, so a hold in progress
 * is never invisible/ambiguous. Uses pointer capture so a small finger wobble
 * during a multi-second hold doesn't cancel it (a plain pointerleave listener
 * fires far too easily on a small touch target).
 */
export function createHoldButton(options: HoldButtonOptions): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = options.className;
  button.setAttribute("aria-label", options.ariaLabel);

  const ring = document.createElement("div");
  ring.className = "hold-ring";
  button.appendChild(ring);

  const label = document.createElement("span");
  label.className = "hold-label";
  label.textContent = options.label;
  button.appendChild(label);

  let rafId: number | null = null;
  let startTime = 0;
  let activePointerId: number | null = null;

  function setProgress(p: number) {
    ring.style.setProperty("--hold-progress", String(Math.max(0, Math.min(1, p))));
  }

  function stepFrame(now: number) {
    const elapsed = now - startTime;
    const progress = elapsed / options.holdMs;
    setProgress(progress);
    if (progress >= 1) {
      cancelHold(false);
      options.onComplete();
      return;
    }
    rafId = requestAnimationFrame(stepFrame);
  }

  function cancelHold(animateBack: boolean) {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    activePointerId = null;
    button.classList.remove("holding");
    if (animateBack) setProgress(0);
  }

  button.addEventListener("pointerdown", (e) => {
    activePointerId = e.pointerId;
    try {
      button.setPointerCapture(e.pointerId);
    } catch {
      // Pointer capture isn't critical — the hold still works without it.
    }
    button.classList.add("holding");
    startTime = performance.now();
    rafId = requestAnimationFrame(stepFrame);
  });

  const stop = (e: PointerEvent) => {
    if (e.pointerId !== activePointerId) return;
    cancelHold(true);
  };
  button.addEventListener("pointerup", stop);
  button.addEventListener("pointercancel", stop);

  return button;
}
