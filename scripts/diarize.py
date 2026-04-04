#!/usr/bin/env python3
"""
Speaker diarization for NotebookLM podcasts using ffmpeg + stdlib only.

Uses silence detection to find speech segments, then zero-crossing rate (ZCR)
analysis to classify each segment as Speaker A (female, higher ZCR) or 
Speaker B (male, lower ZCR).

Output: JSON array of [{index, start, end, duration, speaker, zcr}]
"""
import subprocess
import struct
import sys
import json
import re
import math

# ── Config ─────────────────────────────────────────────────────────────────
SILENCE_NOISE_DB    = "-40dB"   # Noise floor threshold for silence detection
SILENCE_MIN_DUR     = 0.4       # Min silence duration (seconds) to count as a gap
MIN_SEGMENT_DUR     = 1.5       # Discard segments shorter than this
MERGE_MAX_GAP       = 0.8       # Merge same-speaker segments closer than this
MERGE_MIN_DUR       = 2.0       # Merge segments shorter than this with neighbor
MAX_BLOCK_DUR       = 55.0      # Split blocks longer than this (HeyGen limit)
ANALYSIS_SAMPLE_RATE = 8000     # Sample rate for pitch analysis (lower = faster)
ENERGY_THRESHOLD    = 400       # RMS energy threshold for voiced frames
ANALYSIS_SAMPLES    = 15        # Number of segments to sample for ZCR calibration
# ────────────────────────────────────────────────────────────────────────────


def log(msg):
    print(f"  {msg}", file=sys.stderr, flush=True)


def get_audio_duration(audio_file):
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        audio_file
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return float(result.stdout.strip())
    except ValueError:
        return 0.0


def detect_silences(audio_file):
    """Run ffmpeg silencedetect and return list of (silence_start, silence_end) tuples."""
    cmd = [
        "ffmpeg", "-i", audio_file,
        "-af", f"silencedetect=noise={SILENCE_NOISE_DB}:d={SILENCE_MIN_DUR}",
        "-f", "null", "-"
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    stderr = result.stderr

    starts = [float(m) for m in re.findall(r"silence_start: ([0-9.]+)", stderr)]
    ends   = [float(m) for m in re.findall(r"silence_end: ([0-9.]+)", stderr)]

    # If last silence has no end (audio ends in silence), use total duration
    total_duration = get_audio_duration(audio_file)
    if len(starts) > len(ends):
        ends.append(total_duration)

    silences = list(zip(starts, ends))
    return silences, total_duration


def silences_to_segments(silences, total_duration):
    """Convert silence list to speech segment list."""
    segments = []
    cursor = 0.0

    for sil_start, sil_end in sorted(silences):
        seg_end = sil_start
        dur = seg_end - cursor
        if dur >= MIN_SEGMENT_DUR:
            segments.append({
                "start":    round(cursor, 3),
                "end":      round(seg_end, 3),
                "duration": round(dur, 3),
            })
        cursor = sil_end

    # Final segment
    dur = total_duration - cursor
    if dur >= MIN_SEGMENT_DUR:
        segments.append({
            "start":    round(cursor, 3),
            "end":      round(total_duration, 3),
            "duration": round(dur, 3),
        })

    return segments


def extract_pcm(audio_file, start, duration, sample_rate=ANALYSIS_SAMPLE_RATE):
    """Extract a chunk of audio as raw PCM int16 samples using ffmpeg."""
    cmd = [
        "ffmpeg", "-ss", str(start), "-t", str(duration),
        "-i", audio_file,
        "-ar", str(sample_rate), "-ac", "1",
        "-f", "s16le", "-",
        "-loglevel", "error"
    ]
    result = subprocess.run(cmd, capture_output=True)
    data = result.stdout
    n = len(data) // 2
    if n == 0:
        return []
    return list(struct.unpack(f"<{n}h", data))


def compute_voiced_zcr(samples):
    """
    Compute average zero-crossing rate (ZCR) over voiced frames.

    ZCR is a good proxy for pitch: female voices have higher F0 → more ZCRs.
    Only voiced (high-energy) frames are included to avoid noise bias.
    Returns ZCR in crossings/second, or 0 if no voiced frames found.
    """
    if len(samples) < 160:
        return 0.0

    frame_size = 160  # 20ms at 8kHz
    total_zcr = 0.0
    voiced_frames = 0

    for i in range(0, len(samples) - frame_size, frame_size):
        frame = samples[i : i + frame_size]

        # RMS energy
        rms = math.sqrt(sum(s * s for s in frame) / frame_size)
        if rms < ENERGY_THRESHOLD:
            continue  # skip silence / unvoiced frames

        # Count zero crossings
        zc = sum(
            1 for j in range(1, frame_size)
            if (frame[j - 1] >= 0) != (frame[j] >= 0)
        )
        zcr_hz = zc * (ANALYSIS_SAMPLE_RATE / frame_size)
        total_zcr += zcr_hz
        voiced_frames += 1

    if voiced_frames == 0:
        return 0.0
    return total_zcr / voiced_frames


def measure_zcr_for_segments(segments, audio_file):
    """
    Sample a subset of segments and compute their ZCR.
    Returns the same list with a `zcr` key added to sampled segments.
    """
    step = max(1, len(segments) // ANALYSIS_SAMPLES)
    sample_indices = list(range(0, len(segments), step))[:ANALYSIS_SAMPLES]

    log(f"Measuring ZCR on {len(sample_indices)} sample segments...")
    for i in sample_indices:
        seg = segments[i]
        dur = min(3.0, seg["duration"])
        samples = extract_pcm(audio_file, seg["start"], dur)
        seg["_zcr_sample"] = compute_voiced_zcr(samples)

    return segments


def assign_speakers(segments, audio_file):
    """
    Assign speaker labels A/B to each segment.

    Strategy:
      1. Sample a subset of segments for ZCR measurement.
      2. Compute ZCR for ALL remaining segments (fast, using short samples).
      3. Find the median ZCR → segments above = Speaker A (female, higher pitch),
         segments below = Speaker B (male, lower pitch).
      4. Fill missing (ZCR=0) segments from context.
    """
    # Sample phase
    segments = measure_zcr_for_segments(segments, audio_file)

    # Full measurement phase
    log(f"Measuring ZCR on all {len(segments)} segments...")
    for seg in segments:
        if "_zcr_sample" in seg:
            seg["zcr"] = seg.pop("_zcr_sample")
        else:
            dur = min(2.0, seg["duration"])
            samples = extract_pcm(audio_file, seg["start"], dur)
            seg["zcr"] = compute_voiced_zcr(samples)

    # Determine threshold: median of non-zero ZCR values
    non_zero_zcrs = sorted(z["zcr"] for z in segments if z["zcr"] > 0)
    if not non_zero_zcrs:
        log("WARNING: No voiced segments found, using alternating speaker assignment")
        for i, seg in enumerate(segments):
            seg["speaker"] = "A" if i % 2 == 0 else "B"
        return segments

    median_zcr = non_zero_zcrs[len(non_zero_zcrs) // 2]
    log(f"ZCR median threshold: {median_zcr:.0f} Hz (female > threshold > male)")

    # Classify
    for seg in segments:
        if seg["zcr"] == 0:
            seg["speaker"] = None  # Will be filled from context
        else:
            seg["speaker"] = "A" if seg["zcr"] >= median_zcr else "B"

    # Fill None speakers by propagating nearest valid neighbor
    # Forward pass
    last = "A"
    for seg in segments:
        if seg["speaker"] is None:
            seg["speaker"] = last
        else:
            last = seg["speaker"]
    # Backward pass (catches leading Nones)
    last = segments[-1]["speaker"]
    for seg in reversed(segments):
        if seg["speaker"] is None:
            seg["speaker"] = last
        else:
            last = seg["speaker"]

    a_count = sum(1 for s in segments if s["speaker"] == "A")
    b_count = sum(1 for s in segments if s["speaker"] == "B")
    log(f"Speaker assignment: A={a_count} segments, B={b_count} segments")

    return segments


def merge_segments(segments):
    """
    Merge adjacent same-speaker segments with small gaps,
    and absorb very short segments into their longer neighbors.
    """
    if not segments:
        return segments

    merged = [segments[0].copy()]

    for seg in segments[1:]:
        prev = merged[-1]
        gap = seg["start"] - prev["end"]
        same_speaker = prev["speaker"] == seg["speaker"]

        should_merge = (
            (same_speaker and gap <= MERGE_MAX_GAP) or
            (seg["duration"] < MERGE_MIN_DUR and gap <= MERGE_MAX_GAP * 2)
        )

        if should_merge:
            # Keep the speaker label of the longer segment
            if seg["duration"] > prev["duration"]:
                prev["speaker"] = seg["speaker"]
            prev["end"] = seg["end"]
            prev["duration"] = round(prev["end"] - prev["start"], 3)
            prev["zcr"] = (prev.get("zcr", 0) + seg.get("zcr", 0)) / 2
        else:
            merged.append(seg.copy())

    return merged


def split_long_segments(segments):
    """Split segments that exceed MAX_BLOCK_DUR seconds."""
    result = []
    for seg in segments:
        if seg["duration"] <= MAX_BLOCK_DUR:
            result.append(seg)
            continue

        n = math.ceil(seg["duration"] / MAX_BLOCK_DUR)
        chunk_dur = seg["duration"] / n
        for i in range(n):
            cs = seg["start"] + i * chunk_dur
            ce = min(seg["start"] + (i + 1) * chunk_dur, seg["end"])
            result.append({
                "start":    round(cs, 3),
                "end":      round(ce, 3),
                "duration": round(ce - cs, 3),
                "speaker":  seg["speaker"],
                "zcr":      seg.get("zcr", 0),
            })

    return result


def main():
    if len(sys.argv) < 2:
        print("Usage: diarize.py <audio_file> [output.json]", file=sys.stderr)
        sys.exit(1)

    audio_file  = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None

    log(f"=== Diarizing: {audio_file} ===")

    log("Step 1: Detecting silence boundaries...")
    silences, total_duration = detect_silences(audio_file)
    log(f"Audio duration: {total_duration:.1f}s | Silence gaps found: {len(silences)}")

    log("Step 2: Building speech segments...")
    segments = silences_to_segments(silences, total_duration)
    log(f"Speech segments: {len(segments)}")

    if not segments:
        log("ERROR: No speech segments found!")
        sys.exit(1)

    log("Step 3: Assigning speakers via ZCR analysis...")
    segments = assign_speakers(segments, audio_file)

    log("Step 4: Post-processing (merge / split)...")
    segments = merge_segments(segments)
    segments = split_long_segments(segments)

    # Finalize
    for i, seg in enumerate(segments):
        seg["index"] = i
        # Round cleanly
        for k in ("start", "end", "duration", "zcr"):
            if k in seg:
                seg[k] = round(seg[k], 3)

    a_total = sum(s["duration"] for s in segments if s["speaker"] == "A")
    b_total = sum(s["duration"] for s in segments if s["speaker"] == "B")
    log(f"Final: {len(segments)} blocks | A={a_total:.1f}s | B={b_total:.1f}s")

    output = json.dumps(segments, indent=2)

    if output_file:
        with open(output_file, "w") as f:
            f.write(output)
        log(f"Written to: {output_file}")
    else:
        print(output)


if __name__ == "__main__":
    main()
