#!/usr/bin/env python3
"""One-off dev utility: synthesizes a longer, gentler, seamless, original
background music loop (no external assets, no licensing concerns) using only
the Python standard library. Re-run and commit the output if the loop ever
needs to change. Output: src/assets/audio/bg-loop.wav

v2: the first version was an 8s loop with a punchy low pulse every 2s —
at ~75 repeats over a 10-minute session it read as naggy/repetitive. This
version stretches the progression to 32s across 8 chords (so the ear hears
real movement before it repeats), drops the percussive pulse entirely, and
uses a slow "breathing" swell on the pad instead of hard-edged chord blocks.
"""
import math
import struct
import wave
from pathlib import Path

SR = 16000
SECTION_SECONDS = 4.0
# A longer, gently drifting progression (i - VI - III - VII - iv - VI - III - V)
# in A minor, so a listener hears real harmonic movement before it loops.
SECTIONS = [
    (110.00, [220.00, 261.63, 329.63]),  # Am
    (87.31, [174.61, 220.00, 261.63]),  # Fmaj7
    (130.81, [261.63, 329.63, 392.00]),  # C
    (98.00, [196.00, 246.94, 293.66]),  # G
    (87.31, [174.61, 220.00, 261.63, 349.23]),  # Fmaj7(add11), softer variant
    (110.00, [220.00, 261.63, 329.63, 392.00]),  # Am7
    (130.81, [261.63, 329.63, 392.00]),  # C
    (164.81, [196.00, 246.94, 293.66]),  # G/E — gentle lift before the loop
]
DURATION = SECTION_SECONDS * len(SECTIONS)
N = int(SR * DURATION)

buf = [0.0] * N


def add(freq, start_s, dur_s, peak, attack, release, wave_fn=math.sin):
    start = int(start_s * SR)
    length = int(dur_s * SR)
    a = max(1, int(attack * SR))
    r = max(1, int(release * SR))
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


for s, (bass, pad_tones) in enumerate(SECTIONS):
    t0 = s * SECTION_SECONDS
    is_last = s == len(SECTIONS) - 1
    # Warm, slow-breathing pad — long attack/release, no hard onset.
    # Every section but the last overhangs slightly into the next one for a
    # legato feel; the last must fully release inside the buffer, or its
    # tail gets truncated at the loop seam and clicks against the silent start.
    pad_dur = SECTION_SECONDS if is_last else SECTION_SECONDS + 0.6
    pad_release = SECTION_SECONDS * 0.6 if is_last else 1.6
    add(bass, t0, pad_dur, 0.045, attack=1.2, release=pad_release)
    for tone in pad_tones:
        add(tone, t0, pad_dur, 0.028, attack=1.4, release=pad_release)
    # One or two soft, unhurried bell notes per section — sparse, not ticking.
    bell_offsets = [0.3] if (s % 2 == 0 or is_last) else [0.3, 2.2]
    for i, off in enumerate(bell_offsets):
        tone = pad_tones[(i + s) % len(pad_tones)] * 2
        bell_dur = min(2.6, SECTION_SECONDS - off) if is_last else 2.6
        add(
            tone,
            t0 + off,
            bell_dur,
            0.05,
            attack=0.02,
            release=bell_dur * 0.85,
            wave_fn=lambda x: math.sin(x) * 0.75 + math.sin(x * 2) * 0.25,
        )

# Slow overall "breathing" swell across the whole loop, so it never feels flat.
SWELL_HZ = 1 / (DURATION / 2)
for i in range(N):
    swell = 0.85 + 0.15 * math.sin(2 * math.pi * SWELL_HZ * (i / SR))
    buf[i] *= swell

peak = max(1e-6, max(abs(x) for x in buf))
scale = 0.5 / peak  # gentle headroom — this plays at full hardware volume on iOS
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
