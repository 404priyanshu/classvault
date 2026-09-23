"""Create the original, low-key instrumental bed used by the promo."""

from array import array
import math
from pathlib import Path
import wave

SAMPLE_RATE = 22_050
DURATION = 23.0
samples = array("f", [0.0]) * int(SAMPLE_RATE * DURATION)


def tone(start: float, length: float, frequency: float, volume: float, decay: float) -> None:
    start_sample = int(start * SAMPLE_RATE)
    count = min(int(length * SAMPLE_RATE), len(samples) - start_sample)
    for offset in range(count):
        t = offset / SAMPLE_RATE
        attack = min(1.0, t / 0.025)
        release = min(1.0, (length - t) / 0.18)
        envelope = attack * max(0.0, release) * math.exp(-t / decay)
        phase = 2 * math.pi * frequency * t
        sound = math.sin(phase) + 0.24 * math.sin(2 * phase) + 0.08 * math.sin(3 * phase)
        samples[start_sample + offset] += volume * envelope * sound


chords = [
    (0.0, 4.4, (261.63, 329.63, 392.00, 493.88)),
    (4.4, 4.4, (261.63, 349.23, 440.00, 523.25)),
    (8.8, 4.4, (220.00, 261.63, 329.63, 392.00)),
    (13.2, 4.4, (196.00, 246.94, 293.66, 392.00)),
    (17.6, 5.4, (261.63, 329.63, 392.00, 523.25)),
]

for start, length, notes in chords:
    for frequency in notes[:3]:
        tone(start, length, frequency / 2, 0.023, 6.5)
    beat = start
    note_index = 0
    while beat < start + length - 0.4:
        tone(beat, 0.78, notes[note_index % 4], 0.052, 0.27)
        beat += 0.55
        note_index += 1

# A gentle high chime marks each new feature and the closing card.
for start, _, notes in chords[1:]:
    tone(start + 0.24, 1.25, notes[-1] * 2, 0.022, 0.47)

peak = max(abs(value) for value in samples) or 1.0
scale = 0.62 / peak
pcm = array("h")
for index, value in enumerate(samples):
    time = index / SAMPLE_RATE
    fade = min(1.0, time / 0.6, (DURATION - time) / 0.85)
    pcm.append(int(max(-1.0, min(1.0, value * scale * max(0.0, fade))) * 32767))

output = Path(__file__).resolve().parents[1] / "assets" / "classvault-bed.wav"
with wave.open(str(output), "wb") as file:
    file.setnchannels(1)
    file.setsampwidth(2)
    file.setframerate(SAMPLE_RATE)
    file.writeframes(pcm.tobytes())
print(output)
