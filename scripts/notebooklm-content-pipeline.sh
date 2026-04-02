#!/usr/bin/env bash
# NotebookLM Content Pipeline for AIPowerStacks
# Generates podcasts, reports, and research from trending AI topics
# Run daily via cron or manually

set -euo pipefail

VENV="/tmp/notebooklm-env"
NOTEBOOK_ID="74b2f236-65f8-478b-a235-bc6e4df14072"
OUTPUT_DIR="$HOME/aipowerstacks/public/content"
DATE=$(date +%Y-%m-%d)

# Activate venv
source "$VENV/bin/activate"

mkdir -p "$OUTPUT_DIR/podcasts" "$OUTPUT_DIR/reports"

echo "[$DATE] Starting NotebookLM content pipeline..."

# 1. Add fresh research
echo "  → Adding deep research on today's AI trends..."
notebooklm source add-research "AI tools news trends launches $DATE" \
  --mode deep --no-wait --notebook "$NOTEBOOK_ID" 2>/dev/null || true

# Wait for research to complete and import sources
echo "  → Waiting for research (up to 5 min)..."
notebooklm research wait -n "$NOTEBOOK_ID" --import-all --timeout 300 2>/dev/null || true

# 2. Generate podcast
echo "  → Generating podcast..."
AUDIO_RESULT=$(notebooklm generate audio \
  "Create a podcast covering today's biggest AI tool news and trends. Be specific about tool names, features, and why they matter. Target audience: developers and entrepreneurs using AI daily." \
  --format deep-dive --length default --json --notebook "$NOTEBOOK_ID" 2>/dev/null || echo '{}')

AUDIO_TASK=$(echo "$AUDIO_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('task_id',''))" 2>/dev/null || echo "")

# 3. Generate blog report
echo "  → Generating blog report..."
REPORT_RESULT=$(notebooklm generate report \
  --format blog-post \
  --append "Write a comprehensive blog post about today's AI tools landscape. Cover new launches, updates, and trends. For AIPowerStacks readers. SEO-optimized with a compelling title. Include specific tool names." \
  --json --notebook "$NOTEBOOK_ID" 2>/dev/null || echo '{}')

REPORT_TASK=$(echo "$REPORT_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('task_id',''))" 2>/dev/null || echo "")

# 4. Humanize the report (make it sound more human, less AI)
REPORT_FILE="$OUTPUT_DIR/reports/report-$DATE.md"
if [ -f "$REPORT_FILE" ]; then
  echo "  → Humanizing report content..."
  HUMANIZE_SCRIPT="$(dirname "$0")/humanize-content.mjs"
  if [ -f "$HUMANIZE_SCRIPT" ]; then
    node "$HUMANIZE_SCRIPT" "$REPORT_FILE" && \
      echo "  ✅ Content humanized" || \
      echo "  ⚠️ Humanization skipped (non-fatal)"
  else
    echo "  ⚠️ humanize-content.mjs not found, skipping humanization"
  fi
fi

# 4. Wait for artifacts and download
if [ -n "$AUDIO_TASK" ]; then
  echo "  → Waiting for podcast (up to 20 min)..."
  notebooklm artifact wait "$AUDIO_TASK" -n "$NOTEBOOK_ID" --timeout 1200 2>/dev/null || true
  notebooklm download audio "$OUTPUT_DIR/podcasts/podcast-$DATE.mp3" -n "$NOTEBOOK_ID" 2>/dev/null && \
    echo "  ✅ Podcast saved: podcasts/podcast-$DATE.mp3" || \
    echo "  ⚠️ Podcast download failed"
fi

if [ -n "$REPORT_TASK" ]; then
  echo "  → Waiting for report (up to 15 min)..."
  notebooklm artifact wait "$REPORT_TASK" -n "$NOTEBOOK_ID" --timeout 900 2>/dev/null || true
  notebooklm download report "$OUTPUT_DIR/reports/report-$DATE.md" -n "$NOTEBOOK_ID" 2>/dev/null && \
    echo "  ✅ Report saved: reports/report-$DATE.md" || \
    echo "  ⚠️ Report download failed"
fi

# 5. Generate video from podcast (if podcast exists)
PODCAST_FILE="$OUTPUT_DIR/podcasts/podcast-$DATE.mp3"
if [ -f "$PODCAST_FILE" ]; then
  echo "  → Generating podcast video..."
  VIDEO_SCRIPT="$(dirname "$0")/podcast-to-video-local.mjs"
  if [ -f "$VIDEO_SCRIPT" ]; then
    node "$VIDEO_SCRIPT" "$PODCAST_FILE" --date "$DATE" && \
      echo "  ✅ Video generated: videos/video-$DATE.mp4" || \
      echo "  ⚠️ Video generation failed (non-fatal)"
  else
    echo "  ⚠️ podcast-to-video.mjs not found, skipping video"
  fi
else
  echo "  ⚠️ No podcast found at $PODCAST_FILE, skipping video"
fi

echo "[$DATE] Content pipeline complete!"
