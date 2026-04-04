#!/usr/bin/env node
/**
 * AIPowerStacks Podcast → Video (Local / Free)
 *
 * Generates professional podcast videos using only ffmpeg + whisper.
 * No paid APIs needed.
 *
 * Usage:
 *   node podcast-to-video-local.mjs <podcast.mp3> [--test] [--no-shorts] [--date YYYY-MM-DD]
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from "fs";
import { basename, join, resolve } from "path";
import os from "os";

// ── Config ──────────────────────────────────────────────────────────────
const HOME = os.homedir();
const PROJECT = join(HOME, "aipowerstacks");
const SCRIPTS = join(PROJECT, "scripts");
const CONTENT = join(PROJECT, "public/content");
const VIDEOS = join(CONTENT, "videos");
const SHORTS = join(CONTENT, "shorts");

// Brand
const BG_COLOR   = "0x1a1a2e";
const BG_DARK    = "0x0f0f1a";
const ACCENT     = "0xf59e0b";
const ACCENT_HEX = "#f59e0b";
const CARD_BG    = "0x252547";
const CARD_HI    = "0x3a3a6a";
const TEXT_WHITE  = "white";
const TEXT_DIM    = "0xaaaaaa";
const WAVE_COLOR  = "0xf59e0b";

const WIDTH = 1920;
const HEIGHT = 1080;

// ── CLI ──────────────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { test: false, noShorts: false, date: null, input: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--test") opts.test = true;
    else if (args[i] === "--no-shorts") opts.noShorts = true;
    else if (args[i] === "--date") opts.date = args[++i];
    else if (!args[i].startsWith("--")) opts.input = resolve(args[i]);
  }
  return opts;
}

// ── Helpers ──────────────────────────────────────────────────────────────
function log(msg) { console.log(`[${ts()}] ${msg}`); }
function ts() { return new Date().toISOString().substring(11, 19); }
function mkdir(p) { mkdirSync(p, { recursive: true }); }
function run(cmd) { return execSync(cmd, { stdio: "pipe", maxBuffer: 50 * 1024 * 1024 }).toString().trim(); }
function runShow(cmd) { log(`  $ ${cmd.substring(0, 120)}...`); return run(cmd); }

function getDuration(file) {
  const out = run(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`);
  return parseFloat(out) || 0;
}

// ── Diarization ─────────────────────────────────────────────────────────
function diarize(audio, outJson) {
  if (existsSync(outJson)) {
    log("  ⏭️  Using cached diarization");
    return JSON.parse(readFileSync(outJson, "utf8"));
  }
  const script = join(SCRIPTS, "diarize.py");
  run(`python3 "${script}" "${audio}" "${outJson}"`);
  return JSON.parse(readFileSync(outJson, "utf8"));
}

// ── Transcription ───────────────────────────────────────────────────────
function transcribe(audio, outSrt, workDir) {
  if (existsSync(outSrt)) {
    log("  ⏭️  Using cached transcription");
    return outSrt;
  }
  log("  Running whisper...");
  // whisper outputs to the directory, naming based on input file
  // Copy audio to workDir with a simple name
  const tmpAudio = join(workDir, "whisper_input.mp3");
  if (!existsSync(tmpAudio)) {
    run(`cp "${audio}" "${tmpAudio}"`);
  }
  try {
    run(`whisper "${tmpAudio}" --model base --output_format srt --output_dir "${workDir}" --language en 2>/dev/null`);
    const whisperOut = join(workDir, "whisper_input.srt");
    if (existsSync(whisperOut)) {
      run(`mv "${whisperOut}" "${outSrt}"`);
      return outSrt;
    }
  } catch (e) {
    log(`  ⚠️  whisper CLI failed: ${e.message?.substring(0, 80)}`);
  }

  // Fallback: try python module
  try {
    run(`python3 -m whisper "${tmpAudio}" --model base --output_format srt --output_dir "${workDir}" --language en 2>/dev/null`);
    const whisperOut = join(workDir, "whisper_input.srt");
    if (existsSync(whisperOut)) {
      run(`mv "${whisperOut}" "${outSrt}"`);
      return outSrt;
    }
  } catch {}

  // Last fallback: empty srt
  log("  ⚠️  No transcription available, proceeding without captions");
  writeFileSync(outSrt, "");
  return outSrt;
}

// ── Generate speaker frame PNG ──────────────────────────────────────────
function generateFrame(outPng, activeSpeaker, title) {
  // Layout: dark bg, two speaker cards, title at top, branding
  const leftActive  = activeSpeaker === "A";
  const rightActive = activeSpeaker === "B";

  const leftBg  = leftActive  ? CARD_HI : CARD_BG;
  const rightBg = rightActive ? CARD_HI : CARD_BG;
  const leftBorder  = leftActive  ? ACCENT : "0x444466";
  const rightBorder = rightActive ? ACCENT : "0x444466";
  const leftLabel  = leftActive  ? TEXT_WHITE : TEXT_DIM;
  const rightLabel = rightActive ? TEXT_WHITE : TEXT_DIM;

  // Card dimensions
  const cardW = 700, cardH = 500;
  const cardY = 200;
  const leftX = 160, rightX = WIDTH - 160 - cardW;
  const circR = 120;

  // Build complex filter
  const filter = [
    // Background
    `color=c=${BG_COLOR}:s=${WIDTH}x${HEIGHT}:d=1`,

    // Left card background
    `drawbox=x=${leftX}:y=${cardY}:w=${cardW}:h=${cardH}:color=${leftBg}:t=fill`,
    // Left card border
    `drawbox=x=${leftX}:y=${cardY}:w=${cardW}:h=${cardH}:color=${leftBorder}:t=4`,
    // Left avatar circle (filled box as approx)
    `drawbox=x=${leftX + cardW/2 - circR}:y=${cardY + 60}:w=${circR*2}:h=${circR*2}:color=${leftActive ? ACCENT : '0x555577'}:t=fill`,
    // Left speaker label
    `drawtext=text='Sarah':x=${leftX + cardW/2 - 50}:y=${cardY + 310}:fontsize=48:fontcolor=${leftLabel}`,
    `drawtext=text='Host':x=${leftX + cardW/2 - 30}:y=${cardY + 370}:fontsize=28:fontcolor=${TEXT_DIM}`,
    // Left active indicator
    leftActive ? `drawtext=text='🎙':x=${leftX + cardW/2 - 20}:y=${cardY + 420}:fontsize=40:fontcolor=white` : null,

    // Right card background
    `drawbox=x=${rightX}:y=${cardY}:w=${cardW}:h=${cardH}:color=${rightBg}:t=fill`,
    // Right card border
    `drawbox=x=${rightX}:y=${cardY}:w=${cardW}:h=${cardH}:color=${rightBorder}:t=4`,
    // Right avatar circle
    `drawbox=x=${rightX + cardW/2 - circR}:y=${cardY + 60}:w=${circR*2}:h=${circR*2}:color=${rightActive ? ACCENT : '0x555577'}:t=fill`,
    // Right speaker label
    `drawtext=text='Alex':x=${rightX + cardW/2 - 40}:y=${cardY + 310}:fontsize=48:fontcolor=${rightLabel}`,
    `drawtext=text='Host':x=${rightX + cardW/2 - 30}:y=${cardY + 370}:fontsize=28:fontcolor=${TEXT_DIM}`,
    rightActive ? `drawtext=text='🎙':x=${rightX + cardW/2 - 20}:y=${cardY + 420}:fontsize=40:fontcolor=white` : null,

    // Title at top
    `drawtext=text='${escFFmpeg(title)}':x=(w-text_w)/2:y=60:fontsize=42:fontcolor=white`,

    // Branding - bottom
    `drawtext=text='aipowerstacks.com':x=(w-text_w)/2:y=h-50:fontsize=24:fontcolor=${TEXT_DIM}`,

    // Divider line between cards
    `drawbox=x=${WIDTH/2-1}:y=${cardY+40}:w=2:h=${cardH-80}:color=0x444466:t=fill`,
  ].filter(Boolean).join(",");

  run(`ffmpeg -f lavfi -i "${filter}" -frames:v 1 -y "${outPng}" -loglevel error`);
  return outPng;
}

function escFFmpeg(s) {
  return s.replace(/'/g, "'\\''").replace(/:/g, "\\:").replace(/\\/g, "\\\\");
}

// ── Generate video segment ──────────────────────────────────────────────
function generateSegment(audio, framePng, outMp4, srtFile, startOffset, duration) {
  // Combine: still frame + audio + waveform overlay
  // showwaves creates an animated waveform from the audio

  const wavH = 120; // waveform height
  const wavY = HEIGHT - 180; // position above bottom branding
  const hasSubs = existsSync(srtFile) && readFileSync(srtFile, "utf8").trim().length > 10;

  // Build filter_complex
  let fc = [
    // Input 0: frame image, loop for duration
    `[0:v]loop=loop=-1:size=1:start=0,setpts=N/30/TB,scale=${WIDTH}:${HEIGHT},trim=duration=${duration}[bg]`,
    // Input 1: audio → waveform
    `[1:a]showwaves=s=${WIDTH}x${wavH}:mode=cline:rate=30:colors=${ACCENT_HEX}|${ACCENT_HEX}88:scale=sqrt[wave]`,
    // Overlay waveform on background
    `[bg][wave]overlay=0:${wavY}:shortest=1[v1]`,
  ];

  // Add subtitles if available
  if (hasSubs) {
    // Use drawtext approach with subtitle content - simpler than subtitles filter
    // Actually, use the subtitles filter with offset
    const srtEsc = srtFile.replace(/'/g, "'\\''").replace(/:/g, "\\\\:");
    fc.push(`[v1]subtitles='${srtEsc}':force_style='Fontsize=22,PrimaryColour=&Hffffff,OutlineColour=&H000000,Outline=2,Alignment=2,MarginV=220'[vout]`);
  } else {
    fc.push(`[v1]copy[vout]`);
  }

  const filterComplex = fc.join(";");

  const cmd = [
    `ffmpeg`,
    `-loop 1 -framerate 30 -i "${framePng}"`,
    `-ss ${startOffset} -t ${duration} -i "${audio}"`,
    `-filter_complex "${filterComplex}"`,
    `-map "[vout]" -map 1:a`,
    `-c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p`,
    `-c:a aac -ar 44100 -ac 2`,
    `-t ${duration}`,
    `-y "${outMp4}" -loglevel error`,
  ].join(" ");

  run(cmd);
  return outMp4;
}

// ── Intro/Outro cards ───────────────────────────────────────────────────
function createIntro(outMp4, title, date) {
  const filter = [
    `color=c=${BG_COLOR}:s=${WIDTH}x${HEIGHT}:d=3:r=30`,
    `drawtext=text='AI POWER STACKS':x=(w-text_w)/2:y=h/2-120:fontsize=72:fontcolor=white`,
    `drawtext=text='${escFFmpeg(title)}':x=(w-text_w)/2:y=h/2-20:fontsize=40:fontcolor=${ACCENT_HEX.replace('#', '0x')}`,
    `drawtext=text='${escFFmpeg(date)}':x=(w-text_w)/2:y=h/2+50:fontsize=30:fontcolor=${TEXT_DIM}`,
    `drawtext=text='aipowerstacks.com':x=(w-text_w)/2:y=h/2+120:fontsize=24:fontcolor=${TEXT_DIM}`,
  ].join(",");

  // Generate silent audio for intro
  run(`ffmpeg -f lavfi -i "${filter}" -f lavfi -i anullsrc=r=44100:cl=stereo -c:v libx264 -pix_fmt yuv420p -c:a aac -t 3 -y "${outMp4}" -loglevel error`);
  return outMp4;
}

function createOutro(outMp4) {
  const filter = [
    `color=c=${BG_COLOR}:s=${WIDTH}x${HEIGHT}:d=3:r=30`,
    `drawtext=text='Thanks for listening!':x=(w-text_w)/2:y=h/2-80:fontsize=56:fontcolor=white`,
    `drawtext=text='Subscribe for more':x=(w-text_w)/2:y=h/2:fontsize=36:fontcolor=${ACCENT_HEX.replace('#', '0x')}`,
    `drawtext=text='aipowerstacks.com':x=(w-text_w)/2:y=h/2+70:fontsize=28:fontcolor=${TEXT_DIM}`,
  ].join(",");

  run(`ffmpeg -f lavfi -i "${filter}" -f lavfi -i anullsrc=r=44100:cl=stereo -c:v libx264 -pix_fmt yuv420p -c:a aac -t 3 -y "${outMp4}" -loglevel error`);
  return outMp4;
}

// ── Stitching ───────────────────────────────────────────────────────────
function stitchAll(clips, outMp4) {
  const listFile = outMp4 + ".txt";
  const lines = clips.filter(f => existsSync(f)).map(f => `file '${f}'`);
  writeFileSync(listFile, lines.join("\n"));
  run(`ffmpeg -f concat -safe 0 -i "${listFile}" -c copy -y "${outMp4}" -loglevel error`);
  unlinkSync(listFile);
  return outMp4;
}

// ── Shorts ──────────────────────────────────────────────────────────────
function createShorts(fullMp4, segments, date) {
  mkdir(SHORTS);
  // Pick 3 interesting segments spread across the podcast
  const candidates = segments.filter(s => s.duration >= 25).sort((a, b) => b.duration - a.duration);
  const picks = [];
  if (candidates.length <= 3) {
    picks.push(...candidates);
  } else {
    // Spread evenly: beginning, middle, end
    picks.push(candidates[0]);
    picks.push(candidates[Math.floor(candidates.length / 2)]);
    picks.push(candidates[candidates.length - 1]);
  }

  const shorts = [];
  for (let i = 0; i < Math.min(3, picks.length); i++) {
    const seg = picks[i];
    const dur = Math.min(60, seg.duration);
    const out = join(SHORTS, `short-${i + 1}-${date}.mp4`);
    if (existsSync(out)) { shorts.push(out); continue; }

    // Crop center to 9:16, add waveform and branding
    const vw = 1080, vh = 1920;
    run([
      `ffmpeg -ss ${seg.start} -t ${dur} -i "${fullMp4}"`,
      `-vf "crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=${vw}:${vh},`,
      `drawtext=text='AI Power Stacks':x=(w-text_w)/2:y=h-100:fontsize=32:fontcolor=white:box=1:boxcolor=black@0.5:boxborderw=6"`,
      `-c:v libx264 -preset fast -crf 23 -c:a aac -ar 44100`,
      `-y "${out}" -loglevel error`,
    ].join(" "));

    log(`  📱 Short ${i + 1}: ${basename(out)}`);
    shorts.push(out);
  }
  return shorts;
}

// ── Main ────────────────────────────────────────────────────────────────
async function main() {
  const opts = parseArgs();
  if (!opts.input) {
    console.error("Usage: node podcast-to-video-local.mjs <podcast.mp3> [--test] [--no-shorts] [--date YYYY-MM-DD]");
    process.exit(1);
  }
  if (!existsSync(opts.input)) {
    console.error(`File not found: ${opts.input}`);
    process.exit(1);
  }

  const date = opts.date || basename(opts.input).match(/\d{4}-\d{2}-\d{2}/)?.[0]
    || new Date().toISOString().substring(0, 10);
  const title = `AI Tools Deep Dive - ${date}`;
  const workDir = join(CONTENT, "work", `video-${date}`);
  const segsDir = join(workDir, "segments");
  const framesDir = join(workDir, "frames");
  const clipsDir = join(workDir, "clips");

  mkdir(workDir); mkdir(segsDir); mkdir(framesDir); mkdir(clipsDir); mkdir(VIDEOS);

  let audio = opts.input;

  // Test mode: trim to 60s
  if (opts.test) {
    log("🧪 TEST MODE: first 60 seconds");
    const testFile = join(workDir, "test-60s.mp3");
    if (!existsSync(testFile)) {
      run(`ffmpeg -ss 0 -t 60 -i "${audio}" -c:a libmp3lame -q:a 3 -y "${testFile}" -loglevel error`);
    }
    audio = testFile;
  }

  const totalDur = getDuration(audio);
  log(`📁 Input: ${basename(opts.input)} (${Math.round(totalDur)}s)`);

  // Step 1: Diarize
  log("🎙️  Step 1: Speaker diarization...");
  const diaJson = join(workDir, "diarization.json");
  const segments = diarize(audio, diaJson);
  log(`   ${segments.length} segments (A: ${segments.filter(s=>s.speaker==='A').length}, B: ${segments.filter(s=>s.speaker==='B').length})`);

  // Step 2: Transcribe
  log("📝 Step 2: Transcription...");
  const srtFile = join(workDir, "transcript.srt");
  transcribe(audio, srtFile, workDir);

  // Step 3: Generate frames + video segments
  log("🎬 Step 3: Generating video segments...");

  // Pre-generate the two frame variants
  const frameA = join(framesDir, "frame_A.png");
  const frameB = join(framesDir, "frame_B.png");
  if (!existsSync(frameA)) generateFrame(frameA, "A", title);
  if (!existsSync(frameB)) generateFrame(frameB, "B", title);
  log("   Generated speaker frames");

  const clipPaths = [];
  for (const seg of segments) {
    const clipMp4 = join(clipsDir, `clip_${String(seg.index).padStart(3, '0')}.mp4`);
    if (existsSync(clipMp4)) {
      log(`   ⏭️  clip_${seg.index} cached`);
      clipPaths.push(clipMp4);
      continue;
    }

    const frame = seg.speaker === "A" ? frameA : frameB;
    log(`   🔧 Segment ${seg.index}/${segments.length - 1} (${seg.speaker}, ${seg.duration.toFixed(1)}s)`);

    try {
      generateSegment(audio, frame, clipMp4, srtFile, seg.start, seg.duration);
      clipPaths.push(clipMp4);
    } catch (e) {
      log(`   ❌ Segment ${seg.index} failed: ${e.message?.substring(0, 100)}`);
    }
  }

  log(`   ✅ ${clipPaths.length}/${segments.length} clips generated`);

  // Step 4: Intro + Outro
  log("🎨 Step 4: Branding...");
  const introMp4 = join(workDir, "intro.mp4");
  const outroMp4 = join(workDir, "outro.mp4");
  if (!existsSync(introMp4)) createIntro(introMp4, title, date);
  if (!existsSync(outroMp4)) createOutro(outroMp4);

  // Step 5: Stitch
  log("🔗 Step 5: Stitching final video...");
  const finalMp4 = join(VIDEOS, `video-${date}.mp4`);
  const allClips = [introMp4, ...clipPaths, outroMp4];
  stitchAll(allClips, finalMp4);
  log(`   ✅ ${finalMp4}`);

  // Step 6: Shorts
  if (!opts.noShorts && !opts.test) {
    log("📱 Step 6: Creating shorts...");
    const shorts = createShorts(finalMp4, segments, date);
    log(`   ✅ ${shorts.length} shorts`);
  }

  const finalDur = getDuration(finalMp4);
  log(`\n🎉 Done! ${basename(finalMp4)} (${Math.round(finalDur)}s)`);
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
