#!/usr/bin/env python3
"""One-off dev utility: synthesizes a short, seamless, original background
music loop (no external assets, no licensing concerns) using only the
Python standard library. Re-run and commit the output if the loop ever
needs to change. Output: src/assets/audio/bg-loop.wav
"""
import math
import struct
import wave
from pathlib import Path

SR = 16000  # sample rate — plenty for a soft pad/pluck loop, keeps file small
SECTION_SECONDS = 2.0
SECTIONS = [
    # (bass_freq, [pad chord tones...], [arpeggio tones, low->high...])
    (110.00, [220.00, 261.63, 329.63, 392.00], [220.00, 261.63, 329.63, 392.00]),  # Am7
    (87.31, [174.61, 220.00, 261.63, 329.63], [174.61, 220.00, 261.63, 329.63]),  # Fmaj7
    (130.81, [261.63, 329.63, 392.00, 493.88], [261.63, 329.63, 392.00, 493.88]),  # Cmaj7
    (98.00, [196.00, 246.94, 293.66], [196.00, 246.94, 293.66, 392.00]),  # G(add high G)
]
DURATION = SECTION_SECONDS * len(SECTIONS)
N = int(SR * DURATION)

buf = [0.0] * N


def add(freq, start_s, dur_s, peak, attack=0.08, release=0.35, wave_fn=math.sin):
    start = int(start_s * SR)
    length = int(dur_s * SR)
    a = int(attack * SR)
    r = int(release * SR)
    for i in range(length):
        idx = start + i
        if idx >= N:
            break
        if i < a:
            env = i / a
        elif i > length - r:
            env = max(0.0, (length - i) / r)
        else:
            env = 1.0
        t = i / SR
        buf[idx] += peak * env * wave_fn(2 * math.pi * freq * t)


for s, (bass, pad_tones, arp_tones) in enumerate(SECTIONS):
    t0 = s * SECTION_SECONDS
    # Soft low pulse marking the section (like a gentle heartbeat).
    add(bass * 0.5, t0, 0.35, 0.22, attack=0.005, release=0.3)
    # Warm sustained pad chord.
    for tone in pad_tones:
        add(tone, t0, SECTION_SECONDS, 0.05, attack=0.25, release=0.6)
    # Gentle plucked arpeggio, four notes across the section.
    step = SECTION_SECONDS / 4
    for i, tone in enumerate(arp_tones[:4]):
        add(tone * 2, t0 + i * step, step * 0.9, 0.09, attack=0.01, release=step * 0.7,
            wave_fn=lambda x: math.sin(x) * 0.7 + math.sin(x * 2) * 0.3)

# Normalize to a safe headroom, then write as 16-bit PCM mono WAV.
peak = max(1e-6, max(abs(x) for x in buf))
scale = 0.85 / peak
frames = bytearray()
for x in buf:
    v = int(max(-1.0, min(1.0, x * scale)) * 32767)
    frames += struct.pack("<h", v)

out_path = Path(__file__).resolve().parent.parent / "src/assets/audio/bg-loop.wav"
out_path.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(out_path), "wb") as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(SR)
    wf.writeframes(bytes(frames))

print(f"wrote {out_path} ({out_path.stat().st_size / 1024:.1f} KB, {DURATION:.1f}s loop)")
