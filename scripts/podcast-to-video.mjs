#!/usr/bin/env node
/**
 * AIPowerStacks Podcast → Video Pipeline
 *
 * Usage:
 *   node podcast-to-video.mjs <podcast.mp3> [options]
 *
 * Options:
 *   --test         Only process first 30 seconds
 *   --no-upload    Skip HeyGen (diarize + segment only)
 *   --skip-stitch  Skip final ffmpeg stitching
 *   --date YYYY-MM-DD  Override date for output filenames
 *
 * Outputs:
 *   ~/aipowerstacks/public/content/videos/video-YYYY-MM-DD.mp4   (16:9 YouTube)
 *   ~/aipowerstacks/public/content/shorts/short-N-YYYY-MM-DD.mp4 (9:16 vertical)
 */

import { execSync, spawn } from "child_process";
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { basename, dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";
import fs from "fs";
import os from "os";
import path from "path";

// ── Config ──────────────────────────────────────────────────────────────────
const HOME         = os.homedir();
const PROJECT_ROOT = join(HOME, "aipowerstacks");
const SCRIPTS_DIR  = join(PROJECT_ROOT, "scripts");
const PUBLIC_DIR   = join(PROJECT_ROOT, "public");
const CONTENT_DIR  = join(PUBLIC_DIR, "content");
const VIDEOS_DIR   = join(CONTENT_DIR, "videos");
const SHORTS_DIR   = join(CONTENT_DIR, "shorts");
const LOGO_PATH    = join(PUBLIC_DIR, "logo.png");

// Load .env.local
const ENV_PATH = join(PROJECT_ROOT, ".env.local");
const envVars  = loadEnv(ENV_PATH);
const HEYGEN_API_KEY = envVars.HEYGEN_API_KEY || process.env.HEYGEN_API_KEY;

if (!HEYGEN_API_KEY) {
  die("HEYGEN_API_KEY not found in .env.local or environment");
}

// HeyGen avatar IDs
const AVATAR_A = "fbd06ee5aa5d4adea63839371ca06141"; // "Podcast" (female)
const AVATAR_B = "14d2c8222c3a46c0b86cb16a4618da86"; // "Oliver" (male, professional)

// Video settings
const ASPECT_16_9   = { width: 1280, height: 720 };
const ASPECT_9_16   = { width: 720,  height: 1280 };
const SHORTS_COUNT  = 3;
const SHORTS_DUR_S  = 60;         // seconds each short

// HeyGen rate-limit handling
const HEYGEN_CONCURRENT = 3;      // max parallel video jobs
const POLL_INTERVAL_MS  = 15_000; // 15s polling
const MAX_WAIT_MS       = 30 * 60_000; // 30 min max per job
// ────────────────────────────────────────────────────────────────────────────

function loadEnv(path) {
  const vars = {};
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) vars[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
  return vars;
}

function die(msg) {
  console.error(`\n❌  ${msg}`);
  process.exit(1);
}

function log(msg) {
  console.log(`[${new Date().toISOString().substring(11, 19)}] ${msg}`);
}

function mkdir(p) {
  mkdirSync(p, { recursive: true });
}

function run(cmd, opts = {}) {
  log(`$ ${cmd.replace(HEYGEN_API_KEY, "***")}`);
  return execSync(cmd, { stdio: opts.quiet ? "pipe" : "inherit", ...opts });
}

function runCapture(cmd) {
  return execSync(cmd, { stdio: "pipe" }).toString().trim();
}

/** Parse CLI args */
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    test: false,
    noUpload: false,
    skipStitch: false,
    date: null,
    input: null,
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--test")        opts.test = true;
    else if (args[i] === "--no-upload")    opts.noUpload = true;
    else if (args[i] === "--skip-stitch")  opts.skipStitch = true;
    else if (args[i] === "--date")    opts.date = args[++i];
    else if (!args[i].startsWith("--")) opts.input = resolve(args[i]);
  }
  return opts;
}

// ── HTTP helpers ─────────────────────────────────────────────────────────────

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const lib = options.protocol === "http:" ? http : https;
    const req = lib.request(options, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString();
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function heygenGet(path) {
  const res = await httpsRequest({
    hostname: "api.heygen.com",
    path,
    method: "GET",
    headers: { "X-Api-Key": HEYGEN_API_KEY },
  });
  return res.body;
}

async function heygenPost(path, payload) {
  const body = JSON.stringify(payload);
  const res = await httpsRequest({
    hostname: "api.heygen.com",
    path,
    method: "POST",
    headers: {
      "X-Api-Key": HEYGEN_API_KEY,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    },
  }, body);
  return res.body;
}

async function uploadAudioToHeyGen(audioFile) {
  log(`Uploading audio segment: ${basename(audioFile)}`);
  const fileBuffer = readFileSync(audioFile);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "upload.heygen.com",
      path: "/v1/asset",
      method: "POST",
      headers: {
        "X-API-KEY": HEYGEN_API_KEY,
        "Content-Type": "audio/mpeg",
        "Content-Length": fileBuffer.length,
      },
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString();
        try {
          const data = JSON.parse(raw);
          if (data.data?.url) resolve(data.data.url);
          else if (data.data?.id) resolve(`https://resource.heygen.com/asset/${data.data.id}`);
          else {
            log(`Upload response: ${raw}`);
            reject(new Error("No asset URL in upload response"));
          }
        } catch {
          reject(new Error(`Upload parse error: ${raw}`));
        }
      });
    });
    req.on("error", reject);
    req.write(fileBuffer);
    req.end();
  });
}

// ── Video status polling ─────────────────────────────────────────────────────

async function waitForVideo(videoId, label) {
  const deadline = Date.now() + MAX_WAIT_MS;
  log(`Waiting for HeyGen video: ${videoId} (${label})`);

  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    const res = await heygenGet(`/v1/video_status.get?video_id=${videoId}`);
    const status = res?.data?.status;
    const err    = res?.data?.error;

    if (status === "completed") {
      const url = res.data.video_url;
      log(`✅  ${label} completed → ${url}`);
      return url;
    } else if (status === "failed") {
      log(`❌  ${label} failed: ${JSON.stringify(err)}`);
      return null;
    } else {
      log(`   ${label}: ${status}...`);
    }
  }

  log(`⏰  ${label}: timeout after ${MAX_WAIT_MS / 60000} min`);
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Download file ─────────────────────────────────────────────────────────────

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(dest);
    lib.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(dest); });
    }).on("error", (e) => { fs.unlink(dest, () => {}); reject(e); });
  });
}

// ── Diarization ──────────────────────────────────────────────────────────────

function diarize(audioFile, outputJson) {
  const diarizeScript = join(SCRIPTS_DIR, "diarize.py");
  run(`python3 ${diarizeScript} "${audioFile}" "${outputJson}"`);
  return JSON.parse(readFileSync(outputJson, "utf8"));
}

// ── Audio segment extraction ──────────────────────────────────────────────────

function extractSegment(audioFile, start, duration, outFile) {
  if (existsSync(outFile)) {
    log(`  [skip] ${basename(outFile)} already exists`);
    return;
  }
  runCapture(
    `ffmpeg -ss ${start} -t ${duration} -i "${audioFile}" -c:a libmp3lame -q:a 3 "${outFile}" -loglevel error -y`
  );
}

// ── HeyGen video generation ───────────────────────────────────────────────────

async function generateHeyGenVideo(segmentMp3, speaker, segIndex, outDir) {
  const idFile = join(outDir, `seg_${segIndex}.heygen_id`);
  const mp4Out = join(outDir, `seg_${segIndex}.mp4`);

  // Idempotency: if final MP4 exists, skip
  if (existsSync(mp4Out)) {
    log(`  [skip] ${basename(mp4Out)} already exists`);
    return { segIndex, mp4: mp4Out, skipped: true };
  }

  // Check if we already submitted this job
  let videoId = null;
  if (existsSync(idFile)) {
    videoId = readFileSync(idFile, "utf8").trim();
    log(`  [resume] ${basename(mp4Out)} → job ${videoId}`);
  } else {
    // Upload audio
    let audioUrl;
    try {
      audioUrl = await uploadAudioToHeyGen(segmentMp3);
    } catch (e) {
      log(`  ❌ Upload failed for seg ${segIndex}: ${e.message}`);
      return { segIndex, mp4: null, error: e.message };
    }

    const avatarId = speaker === "A" ? AVATAR_A : AVATAR_B;
    const payload = {
      title: `seg_${segIndex}_${speaker}`,
      video_inputs: [{
        character: {
          type: "talking_photo",
          talking_photo_id: avatarId,
        },
        voice: {
          type: "audio",
          audio_url: audioUrl,
        },
        background: {
          type: "color",
          value: "#1a1a2e",  // Dark blue background
        },
      }],
      dimension: { width: ASPECT_16_9.width, height: ASPECT_16_9.height },
    };

    const res = await heygenPost("/v2/video/generate", payload);
    videoId = res?.data?.video_id;

    if (!videoId) {
      log(`  ❌ HeyGen API error for seg ${segIndex}: ${JSON.stringify(res)}`);
      return { segIndex, mp4: null, error: JSON.stringify(res) };
    }

    writeFileSync(idFile, videoId);
    log(`  Submitted seg ${segIndex} (speaker ${speaker}) → job ${videoId}`);
  }

  return { segIndex, videoId, mp4: mp4Out, speaker };
}

// ── Branding ─────────────────────────────────────────────────────────────────

/**
 * Add AIPowerStacks lower-third overlay to a video.
 * Uses drawtext + overlay filters.
 */
function addBranding(inputMp4, outputMp4, title = "AI Power Stacks") {
  if (!existsSync(inputMp4)) return null;

  const fontcolor = "white";
  const boxcolor  = "black@0.5";

  // Lower third: logo + text at bottom
  // If logo exists, overlay it; otherwise text only
  let filter;
  if (existsSync(LOGO_PATH)) {
    filter = [
      `[0:v]scale=${ASPECT_16_9.width}:${ASPECT_16_9.height}:force_original_aspect_ratio=decrease,`,
      `pad=${ASPECT_16_9.width}:${ASPECT_16_9.height}:(ow-iw)/2:(oh-ih)/2[base];`,
      `[1:v]scale=80:80[logo];`,
      `[base][logo]overlay=20:main_h-100[with_logo];`,
      `[with_logo]drawtext=`,
        `text='${title.replace(/'/g, "\\'")}':`,
        `x=120:y=h-80:`,
        `fontsize=32:fontcolor=${fontcolor}:`,
        `box=1:boxcolor=${boxcolor}:boxborderw=5`,
    ].join("");

    runCapture(
      `ffmpeg -i "${inputMp4}" -i "${LOGO_PATH}" -filter_complex "${filter}" ` +
      `-c:v libx264 -c:a copy -y "${outputMp4}" -loglevel error`
    );
  } else {
    filter = [
      `drawtext=text='${title.replace(/'/g, "\\'")}':`,
      `x=20:y=h-80:fontsize=32:fontcolor=${fontcolor}:`,
      `box=1:boxcolor=${boxcolor}:boxborderw=5`,
    ].join("");

    runCapture(
      `ffmpeg -i "${inputMp4}" -vf "${filter}" ` +
      `-c:v libx264 -c:a copy -y "${outputMp4}" -loglevel error`
    );
  }

  return outputMp4;
}

/**
 * Create intro card (3 seconds, colored background + title text)
 */
function createIntroCard(outputMp4, title, date, width, height) {
  const text = title.replace(/'/g, "\\'");
  const subtext = date.replace(/'/g, "\\'");
  runCapture(
    `ffmpeg -f lavfi -i "color=c=#1a1a2e:size=${width}x${height}:duration=3:rate=30" ` +
    `-vf "drawtext=text='AI Power Stacks':x=(w-text_w)/2:y=h/2-60:fontsize=56:fontcolor=white:fontweight=bold," + ` +
    `"drawtext=text='${text}':x=(w-text_w)/2:y=h/2:fontsize=36:fontcolor=#7f8fff," + ` +
    `"drawtext=text='${subtext}':x=(w-text_w)/2:y=h/2+60:fontsize=24:fontcolor=#aaaaaa" ` +
    `-c:v libx264 -pix_fmt yuv420p -y "${outputMp4}" -loglevel error`
  );
  return outputMp4;
}

/**
 * Create outro card (3 seconds)
 */
function createOutroCard(outputMp4, width, height) {
  runCapture(
    `ffmpeg -f lavfi -i "color=c=#1a1a2e:size=${width}x${height}:duration=3:rate=30" ` +
    `-vf "drawtext=text='Subscribe & Follow':x=(w-text_w)/2:y=h/2-40:fontsize=48:fontcolor=white:fontweight=bold," + ` +
    `"drawtext=text='aipowerstacks.com':x=(w-text_w)/2:y=h/2+20:fontsize=32:fontcolor=#7f8fff" ` +
    `-c:v libx264 -pix_fmt yuv420p -y "${outputMp4}" -loglevel error`
  );
  return outputMp4;
}

// ── Stitching ─────────────────────────────────────────────────────────────────

/**
 * Concatenate video files using ffmpeg concat demuxer.
 * Each file gets normalized to same resolution/fps first.
 */
function stitchVideos(inputMp4s, outputMp4, width, height) {
  const tmpDir   = join(os.tmpdir(), "aips_stitch");
  mkdir(tmpDir);

  // Normalize each clip
  const normalized = [];
  for (let i = 0; i < inputMp4s.length; i++) {
    const src  = inputMp4s[i];
    const dest = join(tmpDir, `norm_${i}.mp4`);
    if (!existsSync(src)) {
      log(`  ⚠️  Missing clip: ${src}, skipping`);
      continue;
    }
    runCapture(
      `ffmpeg -i "${src}" ` +
      `-vf "scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,fps=30" ` +
      `-c:v libx264 -preset fast -crf 23 -c:a aac -ar 44100 -ac 2 ` +
      `-y "${dest}" -loglevel error`
    );
    normalized.push(dest);
  }

  if (normalized.length === 0) {
    log("❌  No clips to stitch");
    return null;
  }

  // Write concat list
  const listFile = join(tmpDir, "concat.txt");
  writeFileSync(listFile, normalized.map(f => `file '${f}'`).join("\n"));

  runCapture(
    `ffmpeg -f concat -safe 0 -i "${listFile}" -c copy -y "${outputMp4}" -loglevel error`
  );

  log(`✅  Stitched ${normalized.length} clips → ${basename(outputMp4)}`);
  return outputMp4;
}

// ── Shorts extraction ─────────────────────────────────────────────────────────

/**
 * Extract N short clips from the full video and convert to 9:16 vertical.
 * Picks segments evenly distributed across the podcast.
 */
function extractShorts(fullMp4, segments, date, outDir) {
  mkdir(outDir);
  const shorts = [];

  // Pick the best segments: prefer longer ones spread across the podcast
  const totalDur   = segments.reduce((s, x) => s + x.duration, 0);
  const candidates = segments
    .filter(s => s.duration >= 20)
    .map((s, i) => ({ ...s, idx: i }));

  // Distribute picks evenly
  const picks = [];
  if (candidates.length <= SHORTS_COUNT) {
    picks.push(...candidates.slice(0, SHORTS_COUNT));
  } else {
    const step = Math.floor(candidates.length / SHORTS_COUNT);
    for (let i = 0; i < SHORTS_COUNT; i++) {
      picks.push(candidates[Math.min(i * step + Math.floor(step / 2), candidates.length - 1)]);
    }
  }

  for (let i = 0; i < picks.length; i++) {
    const seg  = picks[i];
    const dur  = Math.min(SHORTS_DUR_S, seg.duration);
    const dest = join(outDir, `short-${i + 1}-${date}.mp4`);

    if (existsSync(dest)) {
      log(`  [skip] ${basename(dest)} already exists`);
      shorts.push(dest);
      continue;
    }

    // Crop 9:16 from center of the 16:9 frame, then reframe
    // Also add branding
    const w9 = ASPECT_9_16.width;
    const h9 = ASPECT_9_16.height;
    const cropW = Math.floor(ASPECT_16_9.height * 9 / 16);

    runCapture(
      `ffmpeg -ss ${seg.start} -t ${dur} -i "${fullMp4}" ` +
      `-vf "crop=${cropW}:${ASPECT_16_9.height}:(iw-${cropW})/2:0,scale=${w9}:${h9}," + ` +
      `"drawtext=text='AI Power Stacks':x=(w-text_w)/2:y=h-80:fontsize=28:fontcolor=white:box=1:boxcolor=black@0.5:boxborderw=4" ` +
      `-c:v libx264 -preset fast -crf 23 -c:a aac -ar 44100 -y "${dest}" -loglevel error`
    );

    log(`✅  Short ${i + 1}: ${basename(dest)}`);
    shorts.push(dest);
  }

  return shorts;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();

  if (!opts.input) {
    die("Usage: node podcast-to-video.mjs <podcast.mp3> [--test] [--no-upload]");
  }
  if (!existsSync(opts.input)) {
    die(`Input file not found: ${opts.input}`);
  }

  const date     = opts.date || basename(opts.input).match(/\d{4}-\d{2}-\d{2}/)?.[0]
                             || new Date().toISOString().substring(0, 10);
  const workDir  = join(CONTENT_DIR, "work", `podcast-${date}`);
  const segsDir  = join(workDir, "segments");
  const clipsDir = join(workDir, "clips");

  mkdir(workDir);
  mkdir(segsDir);
  mkdir(clipsDir);
  mkdir(VIDEOS_DIR);
  mkdir(SHORTS_DIR);

  let audioFile = opts.input;

  // ── Test mode: trim to 30s ─────────────────────────────────────────────────
  if (opts.test) {
    log("🧪  TEST MODE: Processing first 30 seconds only");
    const testFile = join(workDir, "test-30s.mp3");
    if (!existsSync(testFile)) {
      runCapture(`ffmpeg -ss 0 -t 30 -i "${audioFile}" -c:a libmp3lame -q:a 3 -y "${testFile}" -loglevel error`);
    }
    audioFile = testFile;
  }

  // ── Step 1: Diarize ────────────────────────────────────────────────────────
  const diarizationFile = join(workDir, "segments.json");
  let segments;

  if (existsSync(diarizationFile)) {
    log("⏭️   Loading cached diarization...");
    segments = JSON.parse(readFileSync(diarizationFile, "utf8"));
  } else {
    log("🎙️   Step 1: Speaker diarization...");
    segments = diarize(audioFile, diarizationFile);
  }

  log(`✅  Diarized: ${segments.length} segments`);
  const speakerSummary = segments.reduce((acc, s) => {
    acc[s.speaker] = (acc[s.speaker] || 0) + 1; return acc;
  }, {});
  log(`   ${JSON.stringify(speakerSummary)}`);

  if (opts.noUpload) {
    log("⏭️   --no-upload: stopping after diarization");
    console.log(JSON.stringify(segments, null, 2));
    return;
  }

  // ── Step 2: Extract audio segments ────────────────────────────────────────
  log("✂️   Step 2: Extracting audio segments...");
  for (const seg of segments) {
    const segFile = join(segsDir, `seg_${seg.index}.mp3`);
    extractSegment(audioFile, seg.start, seg.duration, segFile);
    seg.audioFile = segFile;
  }

  // ── Step 3: Generate HeyGen videos (batched) ──────────────────────────────
  log("🎬  Step 3: Generating HeyGen videos...");

  const results = [];
  const pending = [...segments];

  while (pending.length > 0) {
    const batch = pending.splice(0, HEYGEN_CONCURRENT);

    // Submit all in batch concurrently
    const submitted = await Promise.all(
      batch.map(seg => generateHeyGenVideo(seg.audioFile, seg.speaker, seg.index, clipsDir))
    );

    // Wait for each submitted job
    for (const item of submitted) {
      if (item.skipped) {
        results.push(item);
        continue;
      }
      if (!item.videoId) {
        log(`  ⚠️  No videoId for seg ${item.segIndex}, skipping`);
        results.push(item);
        continue;
      }

      const videoUrl = await waitForVideo(item.videoId, `seg_${item.segIndex}`);
      if (videoUrl) {
        log(`  ⬇️  Downloading seg ${item.segIndex}...`);
        try {
          await downloadFile(videoUrl, item.mp4);
          results.push({ ...item, success: true });
        } catch (e) {
          log(`  ❌ Download failed: ${e.message}`);
          results.push({ ...item, success: false });
        }
      } else {
        results.push({ ...item, success: false });
      }
    }
  }

  const successful = results.filter(r => r.success || r.skipped);
  log(`✅  ${successful.length}/${segments.length} clips ready`);

  if (opts.skipStitch) {
    log("⏭️   --skip-stitch: stopping before stitching");
    return;
  }

  // ── Step 4: Stitch full video ──────────────────────────────────────────────
  log("🔗  Step 4: Stitching full video...");

  // Sort by segment index
  const orderedClips = results
    .filter(r => r.mp4 && (r.success || r.skipped))
    .sort((a, b) => a.segIndex - b.segIndex)
    .map(r => r.mp4);

  const { width, height } = ASPECT_16_9;
  const podcastTitle = `AI Tools Deep Dive - ${date}`;

  // Create intro + outro
  const introCard = join(workDir, "intro.mp4");
  const outroCard = join(workDir, "outro.mp4");
  createIntroCard(introCard, podcastTitle, date, width, height);
  createOutroCard(outroCard, width, height);

  // Stitch all
  const stitchedRaw  = join(workDir, "full_raw.mp4");
  const finalYoutube = join(VIDEOS_DIR, `video-${date}.mp4`);

  const allClips = [introCard, ...orderedClips, outroCard];
  const rawOut   = stitchVideos(allClips, stitchedRaw, width, height);

  if (!rawOut) {
    log("❌  Stitching failed");
    process.exit(1);
  }

  // Add branding overlay
  log("🎨  Adding branding overlay...");
  addBranding(stitchedRaw, finalYoutube, podcastTitle);
  log(`✅  YouTube video: ${finalYoutube}`);

  // ── Step 5: Create shorts ──────────────────────────────────────────────────
  log("📱  Step 5: Creating shorts...");
  const shorts = extractShorts(finalYoutube, segments, date, SHORTS_DIR);
  log(`✅  Created ${shorts.length} shorts in ${SHORTS_DIR}`);

  // ── Done ────────────────────────────────────────────────────────────────────
  console.log("\n🎉  Pipeline complete!");
  console.log(`   Full video:  ${finalYoutube}`);
  shorts.forEach((s, i) => console.log(`   Short ${i + 1}:     ${s}`));
}

main().catch(e => {
  console.error("Fatal error:", e);
  process.exit(1);
});
