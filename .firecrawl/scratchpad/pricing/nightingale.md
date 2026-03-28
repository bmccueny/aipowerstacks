# ![Nightingale](https://nightingale.cafe/logo.png)

Turn any song into karaoke. A self-contained party game that separates
vocals, transcribes lyrics, and plays it all back with word-level sync
and pitch scoring.

[Linux](https://github.com/rzru/nightingale/releases/latest/download/nightingale-x86_64-unknown-linux-gnu.tar.gz)

[x86\_64](https://github.com/rzru/nightingale/releases/latest/download/nightingale-x86_64-unknown-linux-gnu.tar.gz) [ARM (aarch64)](https://github.com/rzru/nightingale/releases/latest/download/nightingale-aarch64-unknown-linux-gnu.tar.gz)

[macOS](https://nightingale.cafe/docs/getting-started.html)

[Windows](https://github.com/rzru/nightingale/releases/latest/download/nightingale-x86_64-pc-windows-msvc.zip)

[Docs](https://nightingale.cafe/docs/)

## Features

### 🎤 Stem separation

Vocals are isolated from instrumentals using the UVR Karaoke model or Demucs. Guide vocal volume is adjustable.

### 📝 Word-level lyrics

WhisperX transcribes and aligns every word to the audio. Existing lyrics from LRCLIB are used when available.

### 🎯 Pitch scoring

Sing into your mic and get scored in real-time. Star ratings and per-song scoreboards track your progress.

### 👤 Player profiles

Multiple profiles with separate score histories. Switch between singers without losing anyone's records.

### 🎬 Video file support

Drop .mp4 or .mkv files into your library. Vocals are separated and the original video plays as the background.

### 🌌 Dynamic backgrounds

GPU shader effects (plasma, aurora, nebula...), Pixabay video loops, or the source video for video files.

### 🎮 Gamepad

Navigate menus, pick songs, and control playback entirely with a controller. D-pad, sticks, face buttons.

### 📦 Single binary

ffmpeg, Python, PyTorch, and the ML models are all bootstrapped on first launch. Nothing to install.

## How it works

### Separate

UVR Karaoke or Demucs splits the track into vocals and instrumental. Audio is extracted from video files automatically.

### Transcribe

Synced lyrics are looked up on LRCLIB first. If nothing's found, WhisperX transcribes the vocals with word-level alignment.

### Play

The instrumental plays back with highlighted lyrics, pitch scoring, dynamic backgrounds, and gamepad support.

## Platforms

Runs on Linux, macOS, and Windows. GPU acceleration via CUDA or Metal when
available, CPU fallback everywhere else.

**Linux** x86\_64, aarch64

**macOS** ARM, Intel

**Windows** x86\_64

## Stay in the loop

Get notified about new releases and updates. No spam, unsubscribe anytime.

Subscribe